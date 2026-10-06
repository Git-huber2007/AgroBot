import type { SupabaseClient } from '@supabase/supabase-js';
import {
  CropRecommendationResultSchema,
  PROMPT_VERSION,
  type CropRecommendationResult,
  type Farm,
  type RecommendationRequestInput,
} from '@cropsage/shared';
import { AI_CONFIGS } from '../config/ai.js';
import { generateStructured } from '../ai/generateStructured.js';
import { cropRecommendationGeminiSchema } from '../ai/schemas/cropRecommendation.schema.js';
import { buildCropRecommendationPrompt } from '../ai/prompts/cropRecommendation.js';
import { NotFoundError } from '../utils/errors.js';

export class RecommendationService {
  public static async generateRecommendations(
    userClient: SupabaseClient,
    userId: string,
    requestId: string,
    input: RecommendationRequestInput,
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

    // 2. Fetch Eligible Candidate Crops for this season
    const { data: allCrops, error: cropsErr } = await userClient
      .from('crops')
      .select('id, name_en, category, seasons')
      .eq('is_active', true);

    if (cropsErr || !allCrops || allCrops.length === 0) {
      throw new Error('Crop catalog is unavailable.');
    }

    // Filter crops matching season
    const candidateCrops = allCrops.filter(c =>
      (c.seasons as string[]).includes(input.season) || (c.seasons as string[]).includes('perennial'),
    );

    const eligibleList = candidateCrops.length > 0 ? candidateCrops : allCrops;

    // Resolve previous crop name if specified
    let prevCropName: string | null = null;
    if (input.previous_crop_id) {
      const match = allCrops.find(c => c.id === input.previous_crop_id);
      if (match) prevCropName = match.name_en;
    }

    // 3. Build prompt
    const promptText = buildCropRecommendationPrompt({
      farm: farm as Farm,
      season: input.season,
      sowing_month: input.sowing_month,
      water_availability: input.water_availability,
      budget_min_inr_per_acre: input.budget_min_inr_per_acre,
      budget_max_inr_per_acre: input.budget_max_inr_per_acre,
      risk_appetite: input.risk_appetite,
      market_access: input.market_access,
      previous_crop: prevCropName,
      candidate_crops: eligibleList.map(c => ({
        id: c.id,
        name_en: c.name_en,
        category: c.category,
      })),
      language: input.language,
    });

    const config = AI_CONFIGS.crop_recommendation;

    // 4. Generate with Gemini
    const result = await generateStructured<CropRecommendationResult>({
      feature: 'crop_recommendation',
      userId,
      requestId,
      model: config.model,
      systemInstruction: 'You are CropSage agronomy advisor. Strictly output valid JSON matching the schema.',
      parts: [{ text: promptText }],
      responseSchema: cropRecommendationGeminiSchema,
      zodSchema: CropRecommendationResultSchema,
      temperature: config.temperature,
      maxOutputTokens: config.maxOutputTokens,
      timeoutMs: config.timeoutMs,
      maxRetries: config.maxRetries,
      postValidate: data => {
        const ranks = data.recommendations.map(r => r.rank);
        const expectedRanks = Array.from({ length: ranks.length }, (_, i) => i + 1);
        if (JSON.stringify(ranks) !== JSON.stringify(expectedRanks)) {
          return 'Ranks must be unique and sequential starting from 1';
        }

        for (let i = 0; i < data.recommendations.length - 1; i++) {
          const curr = data.recommendations[i]!;
          const next = data.recommendations[i + 1]!;
          if (curr.suitability_score < next.suitability_score) {
            return 'Suitability scores must be non-increasing by rank';
          }
        }

        for (const rec of data.recommendations) {
          if (rec.input_cost_inr_per_acre.max < rec.input_cost_inr_per_acre.min) {
            return `Max input cost cannot be less than min cost for ${rec.crop_name}`;
          }
        }

        return null;
      },
    });

    // 5. Attach crop_ids to recommendations
    const enrichedRecs = result.data.recommendations.map(rec => {
      const match = allCrops.find(
        c => c.name_en.toLowerCase() === rec.crop_name.toLowerCase(),
      );
      return {
        ...rec,
        crop_id: match ? match.id : undefined,
      };
    });

    const finalResult = {
      ...result.data,
      recommendations: enrichedRecs,
    };

    // 6. Save in database
    const { data: savedRow, error: saveErr } = await userClient
      .from('crop_recommendations')
      .insert({
        user_id: userId,
        farm_id: farm.id,
        season: input.season,
        sowing_month: input.sowing_month,
        water_availability: input.water_availability,
        budget_min_inr_per_acre: input.budget_min_inr_per_acre,
        budget_max_inr_per_acre: input.budget_max_inr_per_acre,
        risk_appetite: input.risk_appetite,
        market_access: input.market_access,
        previous_crop_id: input.previous_crop_id || null,
        language: input.language,
        result: finalResult,
        model: result.model,
        prompt_version: PROMPT_VERSION,
      })
      .select('*')
      .single();

    if (saveErr) {
      throw new Error(`Failed to save recommendations: ${saveErr.message}`);
    }

    return {
      ...savedRow,
      farm_name: farm.name,
    };
  }
}
