import { LANGUAGE_LOOKUP, type AppLanguage, type Farm, type Season } from '@cropsage/shared';
import { toIsoDate } from '../../utils/dates.js';
import type { WeatherSummary } from '../../services/weather.service.js';
import { formatDelimitedInput } from '../safety/sanitizeUserInput.js';
import { formatFarmContextBlock, formatWeatherForecastTable } from './contextBlocks.js';

export interface CropAdvisoryPromptContext {
  farm: Farm;
  crop: {
    name_en: string;
    scientific_name?: string | null;
    duration_days_min: number;
    duration_days_max: number;
    npk_recommendation_kg_ha: { N: number; P2O5: number; K2O: number };
  };
  variety?: string | null;
  sowing_date: string;
  das: number;
  growth_stage_key: string;
  growth_stage_label: string;
  season: Season;
  concern?: string | null;
  language: AppLanguage;
  weather?: WeatherSummary | null;
}

export function buildCropAdvisoryPrompt(ctx: CropAdvisoryPromptContext): string {
  const langMeta = LANGUAGE_LOOKUP[ctx.language] ?? LANGUAGE_LOOKUP.en;
  const farmBlock = formatFarmContextBlock(ctx.farm);
  const weatherBlock = formatWeatherForecastTable(ctx.weather);

  return `TASK: Generate a stage-specific crop advisory for the next 7–10 days.

OUTPUT_LANGUAGE: ${langMeta.name} (${langMeta.code})
TODAY: ${toIsoDate()}

FARM CONTEXT
${farmBlock}

CROP CONTEXT
- Crop: ${ctx.crop.name_en} (${ctx.crop.scientific_name ?? 'N/A'}); variety: ${ctx.variety ?? 'not specified'}
- Season: ${ctx.season}; sowing date: ${ctx.sowing_date}; days after sowing: ${ctx.das}
- Current growth stage: ${ctx.growth_stage_label} (stage key "${ctx.growth_stage_key}")
- Typical crop duration: ${ctx.crop.duration_days_min}–${ctx.crop.duration_days_max} days
- General NPK recommendation (kg/ha): N ${ctx.crop.npk_recommendation_kg_ha.N}, P2O5 ${ctx.crop.npk_recommendation_kg_ha.P2O5}, K2O ${ctx.crop.npk_recommendation_kg_ha.K2O}

7-DAY WEATHER FORECAST (Open-Meteo)
${weatherBlock.table}
Rule-based alerts already detected: ${weatherBlock.ruleAlerts}

FARMER'S CONCERN
${formatDelimitedInput(ctx.concern, 'No specific concern.')}

INSTRUCTIONS
- Focus on what the farmer must do in the next 7–10 days at THIS growth stage.
- Adjust irrigation advice to forecast rainfall and temperature (e.g., skip irrigation if >20 mm rain expected within 48 h).
- Pest/disease watch-list must reflect stage + weather (e.g., high humidity → fungal risk).
- Give 3–8 priority_tasks ordered by priority.
- Cost estimate is a rough per-acre range for the recommended inputs only.
- Directly address the farmer's concern inside summary or priority_tasks if one was given.
Return JSON matching the schema.`;
}
