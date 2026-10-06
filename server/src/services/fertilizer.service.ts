import type { SupabaseClient } from '@supabase/supabase-js';
import {
  FertilizerScheduleResultSchema,
  PROMPT_VERSION,
  type FertilizerRequestInput,
  type FertilizerScheduleResult,
  type Farm,
} from '@cropsage/shared';
import { AI_CONFIGS } from '../config/ai.js';
import { generateStructured } from '../ai/generateStructured.js';
import { fertilizerScheduleGeminiSchema } from '../ai/schemas/fertilizerSchedule.schema.js';
import { buildFertilizerSchedulePrompt } from '../ai/prompts/fertilizerSchedule.js';
import {
  calculateFertilizerRequirements,
  type CalculatedProductAllocation,
} from './fertilizerCalculator.js';
import { NotFoundError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export class FertilizerService {
  public static async createPlan(
    userClient: SupabaseClient,
    userId: string,
    requestId: string,
    input: FertilizerRequestInput,
  ) {
    // 1. Fetch Farm
    const { data: farm, error: farmErr } = await userClient
      .from('farms')
      .select('*')
      .eq('id', input.farm_id)
      .maybeSingle();

    if (farmErr || !farm) {
      throw new NotFoundError('Farm not found or you do not have permission to access it.');
    }

    // 2. Fetch Crop
    const { data: crop, error: cropErr } = await userClient
      .from('crops')
      .select('*')
      .eq('id', input.crop_id)
      .maybeSingle();

    if (cropErr || !crop) {
      throw new NotFoundError('Selected crop not found in catalog.');
    }

    // 3. DETERMINISTIC CALCULATION FIRST (§4.6)
    const baseNpk = crop.npk_recommendation_kg_ha as { N: number; P2O5: number; K2O: number };
    const soilN = input.soil_n !== undefined && input.soil_n !== null ? input.soil_n : farm.soil_n;
    const soilP = input.soil_p !== undefined && input.soil_p !== null ? input.soil_p : farm.soil_p;
    const soilK = input.soil_k !== undefined && input.soil_k !== null ? input.soil_k : farm.soil_k;

    const calcResult = calculateFertilizerRequirements({
      baseNpk,
      areaHectares: input.area_hectares,
      selectedFertilizers: input.available_fertilizers,
      soilTest: {
        soilN,
        soilP,
        soilK,
      },
      targetYieldTHa: input.target_yield_t_ha,
    });

    // 4. Ask Gemini for split-application schedule only (§15.4)
    const stagesList = (crop.growth_stages as Array<{ label_en: string }>)
      .map(s => s.label_en)
      .join(', ');

    const promptText = buildFertilizerSchedulePrompt({
      farm: farm as Farm,
      crop_name_en: crop.name_en,
      duration_days_min: crop.duration_days_min,
      duration_days_max: crop.duration_days_max,
      stages_list: stagesList,
      area_hectares: input.area_hectares,
      computed_products: calcResult.products,
      soilRatings: calcResult.soilRatings,
      language: input.language,
    });

    const config = AI_CONFIGS.fertilizer_plan;
    let scheduleData: FertilizerScheduleResult;

    try {
      const geminiResult = await generateStructured<FertilizerScheduleResult>({
        feature: 'fertilizer_plan',
        userId,
        requestId,
        model: config.model,
        systemInstruction:
          'You are CropSage agronomy advisor. Distribute the provided fertilizer totals into split applications without changing any product totals.',
        parts: [{ text: promptText }],
        responseSchema: fertilizerScheduleGeminiSchema,
        zodSchema: FertilizerScheduleResultSchema,
        temperature: config.temperature,
        maxOutputTokens: config.maxOutputTokens,
        timeoutMs: config.timeoutMs,
        maxRetries: config.maxRetries,
        postValidate: data => {
          // Verify that sum of splits for each product equals computed total within tolerance
          for (const prod of calcResult.products) {
            let sumInSplits = 0;
            for (const split of data.splits) {
              const matched = split.products.find(
                p => p.product.toLowerCase().trim() === prod.name.toLowerCase().trim(),
              );
              if (matched) {
                sumInSplits += matched.kg_total;
              }
            }

            const tolerance = Math.max(0.5, prod.kg_total * 0.02);
            if (Math.abs(sumInSplits - prod.kg_total) > tolerance) {
              return `Split total for ${prod.name} (${sumInSplits.toFixed(1)} kg) does not match required total (${prod.kg_total} kg)`;
            }
          }
          return null;
        },
      });

      scheduleData = geminiResult.data;
    } catch (aiErr) {
      logger.warn({ aiErr }, 'AI split scheduling failed; engaging deterministic fallback schedule (§15.4)');
      scheduleData = this.buildDeterministicFallbackSchedule(
        crop.name_en,
        calcResult.products,
        calcResult.organicNotes,
      );
    }

    // 5. Persist to fertilizer_plans
    const { data: savedPlan, error: saveErr } = await userClient
      .from('fertilizer_plans')
      .insert({
        user_id: userId,
        farm_id: farm.id,
        crop_id: crop.id,
        area_hectares: input.area_hectares,
        target_yield_t_ha: input.target_yield_t_ha || null,
        inputs: {
          soil_n: soilN,
          soil_p: soilP,
          soil_k: soilK,
          available_fertilizers: input.available_fertilizers,
        },
        computed_quantities: calcResult.products,
        ai_schedule: scheduleData,
        language: input.language,
        model: config.model,
        prompt_version: PROMPT_VERSION,
      })
      .select('*')
      .single();

    if (saveErr) {
      throw new Error(`Failed to save fertilizer plan: ${saveErr.message}`);
    }

    return {
      ...savedPlan,
      farm_name: farm.name,
      crop_name: crop.name_en,
    };
  }

  /**
   * Deterministic fallback split schedule (§15.4)
   * N: 50% basal / 25% stage 2 / 25% stage 3; P & K: 100% basal
   */
  private static buildDeterministicFallbackSchedule(
    cropName: string,
    products: CalculatedProductAllocation[],
    organicNotes: string[],
  ): FertilizerScheduleResult {
    const basalProducts: Array<{ product: string; kg_total: number }> = [];
    const split2Products: Array<{ product: string; kg_total: number }> = [];
    const split3Products: Array<{ product: string; kg_total: number }> = [];

    for (const p of products) {
      if (p.fertilizerKey === 'urea' || p.fertilizerKey === 'ammonium_sulphate') {
        const basal = Number((p.kg_total * 0.5).toFixed(1));
        const s2 = Number((p.kg_total * 0.25).toFixed(1));
        const s3 = Number((p.kg_total - basal - s2).toFixed(1));
        basalProducts.push({ product: p.name, kg_total: basal });
        split2Products.push({ product: p.name, kg_total: s2 });
        split3Products.push({ product: p.name, kg_total: s3 });
      } else {
        basalProducts.push({ product: p.name, kg_total: p.kg_total });
      }
    }

    const splits = [
      {
        stage: 'Basal / Sowing Stage',
        days_after_sowing: '0 (At Sowing / Transplanting)',
        products: basalProducts,
        method: 'Soil placement 5 cm below and to the side of seed furrow',
        notes: 'Full P & K and half N applied at sowing.',
      },
    ];

    if (split2Products.length > 0) {
      splits.push({
        stage: 'Early Vegetative / Tillering',
        days_after_sowing: '25–30 Days After Sowing',
        products: split2Products,
        method: 'Top dressing followed by light irrigation',
        notes: 'Broadcast top-dress during moist soil conditions.',
      });
    }

    if (split3Products.length > 0) {
      splits.push({
        stage: 'Panicle / Flowering Initiation',
        days_after_sowing: '50–60 Days After Sowing',
        products: split3Products,
        method: 'Top dressing followed by light irrigation',
        notes: 'Final nitrogen top-dressing to support grain formation.',
      });
    }

    return {
      summary: `Scientific nutrient recommendation for ${cropName} calculated according to Soil Health Card guidelines. Total quantities are distributed into basal and top-dressing splits for optimal nutrient uptake.`,
      splits,
      organic_supplements: organicNotes,
      micronutrient_advice: [
        'Apply 25 kg/ha Zinc Sulphate (21%) as basal if soil test indicates zinc deficiency.',
      ],
      application_tips: [
        'Never top-dress nitrogen fertilizer when leaves are wet to prevent leaf scorch.',
        'Ensure optimum soil moisture at the time of top dressing.',
        'Store fertilizers in a cool, dry place off the ground.',
      ],
      warnings: [
        'Avoid applying fertilizer immediately before anticipated heavy rain to prevent leaching loss.',
        'Follow recommended safety and protective measures when handling fertilizer bags.',
      ],
      fallback: true,
    };
  }
}
