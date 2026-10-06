import {
  LANGUAGE_LOOKUP,
  type AppLanguage,
  type Farm,
  type Season,
  type WaterLevel,
} from '@cropsage/shared';
import { toIsoDate } from '../../utils/dates.js';
import { formatFarmContextBlock } from './contextBlocks.js';

export interface CropRecommendationPromptContext {
  farm: Farm;
  season: Season;
  sowing_month: number;
  water_availability: WaterLevel;
  budget_min_inr_per_acre: number;
  budget_max_inr_per_acre: number;
  risk_appetite: string;
  market_access: string;
  previous_crop?: string | null;
  candidate_crops: Array<{ id: number; name_en: string; category: string }>;
  language: AppLanguage;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function buildCropRecommendationPrompt(ctx: CropRecommendationPromptContext): string {
  const langMeta = LANGUAGE_LOOKUP[ctx.language] ?? LANGUAGE_LOOKUP.en;
  const farmBlock = formatFarmContextBlock(ctx.farm);
  const monthName = MONTH_NAMES[ctx.sowing_month - 1] ?? 'Current Month';
  const candidateList = ctx.candidate_crops
    .map(c => `- ${c.name_en} (${c.category})`)
    .join('\n');

  return `TASK: Recommend the 3–5 most suitable crops for this farm for the upcoming season.

OUTPUT_LANGUAGE: ${langMeta.name} (${langMeta.code})
TODAY: ${toIsoDate()}

FARM CONTEXT
${farmBlock}

PLANNING INPUTS
- Target season: ${ctx.season}; planned sowing month: ${monthName}
- Water availability: ${ctx.water_availability}
- Budget: ₹${ctx.budget_min_inr_per_acre}–₹${ctx.budget_max_inr_per_acre} per acre
- Risk appetite: ${ctx.risk_appetite}; market access: ${ctx.market_access}
- Previous crop: ${ctx.previous_crop ?? 'unknown'}

CANDIDATE CROPS (choose ONLY from this list; copy crop_name exactly as written in English):
${candidateList}

INSTRUCTIONS
- Rank by overall suitability for THIS soil, region climate, season, water and budget.
- Prefer crop rotation benefits (e.g., pulse after cereal) when the previous crop is known.
- suitability_score is 0–100 and must be consistent with the ranking (rank 1 highest).
- suggested_varieties: only well-known publicly released varieties suitable for the region; if unsure, return an empty array — never invent variety names.
- Cost and yield figures are indicative ranges; state assumptions.
Return JSON matching the schema.`;
}
