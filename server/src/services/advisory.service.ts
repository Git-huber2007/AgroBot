import type { SupabaseClient } from '@supabase/supabase-js';
import {
  CropAdvisoryResultSchema,
  PROMPT_VERSION,
  type AdvisoryRequestInput,
  type CropAdvisoryResult,
  type Farm,
} from '@cropsage/shared';
import { AI_CONFIGS } from '../config/ai.js';
import { generateStructured } from '../ai/generateStructured.js';
import { cropAdvisoryGeminiSchema } from '../ai/schemas/cropAdvisory.schema.js';
import { buildCropAdvisoryPrompt } from '../ai/prompts/cropAdvisory.js';
import { WeatherService, type WeatherSummary } from './weather.service.js';
import { autoSuggestGrowthStage, type GrowthStageItem } from './growthStage.js';
import { NotFoundError } from '../utils/errors.js';
import { daysBetween } from '../utils/dates.js';

export class AdvisoryService {
  public static async generateAdvisory(
    userClient: SupabaseClient,
    userId: string,
    requestId: string,
    input: AdvisoryRequestInput,
  ) {
    // 1. Fetch Farm (RLS guarantees user ownership)
    const { data: farm, error: farmErr } = await userClient
      .from('farms')
      .select('*')
      .eq('id', input.farm_id)
      .maybeSingle();

    if (farmErr || !farm) {
      throw new NotFoundError('Farm not found or you do not have permission to access it.');
    }

    // 2. Fetch Crop details
    const { data: crop, error: cropErr } = await userClient
      .from('crops')
      .select('*')
      .eq('id', input.crop_id)
      .maybeSingle();

    if (cropErr || !crop) {
      throw new NotFoundError('Selected crop was not found in catalog.');
    }

    // 3. Resolve growth stage label and DAS
    const stages = crop.growth_stages as GrowthStageItem[];
    const stageSuggestion = autoSuggestGrowthStage(input.sowing_date, stages);
    const das = Math.max(0, daysBetween(input.sowing_date));
    const matchedStage = stages.find(s => s.key === input.growth_stage) || stageSuggestion.stage;

    // 4. Fetch 7-Day Live Weather (if coordinates available)
    let weather: WeatherSummary | null = null;
    if (farm.latitude !== null && farm.longitude !== null) {
      weather = await WeatherService.getForecast(Number(farm.latitude), Number(farm.longitude));
    }

    // 5. Build prompt
    const promptText = buildCropAdvisoryPrompt({
      farm: farm as Farm,
      crop: {
        name_en: crop.name_en,
        scientific_name: crop.scientific_name,
        duration_days_min: crop.duration_days_min,
        duration_days_max: crop.duration_days_max,
        npk_recommendation_kg_ha: crop.npk_recommendation_kg_ha,
      },
      variety: input.variety,
      sowing_date: input.sowing_date,
      das,
      growth_stage_key: matchedStage.key,
      growth_stage_label: matchedStage.label_en,
      season: input.season,
      concern: input.concern,
      language: input.language,
      weather,
    });

    const config = AI_CONFIGS.crop_advisory;

    // 6. Generate with Gemini & validate Zod schema + business rules
    const result = await generateStructured<CropAdvisoryResult>({
      feature: 'crop_advisory',
      userId,
      requestId,
      model: config.model,
      systemInstruction: 'You are CropSage agronomy advisor. Follow the provided schema strictly.',
      parts: [{ text: promptText }],
      responseSchema: cropAdvisoryGeminiSchema,
      zodSchema: CropAdvisoryResultSchema,
      temperature: config.temperature,
      maxOutputTokens: config.maxOutputTokens,
      timeoutMs: config.timeoutMs,
      maxRetries: config.maxRetries,
      postValidate: data => {
        if (data.estimated_cost.max_inr_per_acre < data.estimated_cost.min_inr_per_acre) {
          return 'Estimated maximum cost cannot be less than minimum cost';
        }
        if (farm.farming_practice === 'organic' || farm.farming_practice === 'natural') {
          for (const item of data.nutrient_plan.items) {
            if (/urea|dap|mop|ssp|npk|ammonium|potash/i.test(item.product)) {
              return `Synthetic fertilizer "${item.product}" is not permitted for organic/natural farming practice`;
            }
          }
        }
        return null;
      },
    });

    // 7. Persist advisory row
    const { data: savedAdvisory, error: saveErr } = await userClient
      .from('crop_advisories')
      .insert({
        user_id: userId,
        farm_id: farm.id,
        crop_id: crop.id,
        variety: input.variety || null,
        sowing_date: input.sowing_date,
        growth_stage: matchedStage.key,
        season: input.season,
        concern: input.concern || null,
        language: input.language,
        weather_snapshot: weather ? weather.daily : null,
        result: result.data,
        model: result.model,
        prompt_version: PROMPT_VERSION,
      })
      .select('*')
      .single();

    if (saveErr) {
      throw new Error(`Failed to save advisory: ${saveErr.message}`);
    }

    return {
      ...savedAdvisory,
      farm_name: farm.name,
      crop_name: crop.name_en,
    };
  }
}
