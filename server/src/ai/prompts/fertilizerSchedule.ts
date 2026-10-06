import { LANGUAGE_LOOKUP, type AppLanguage, type Farm } from '@cropsage/shared';
import type { CalculatedProductAllocation, SoilRating } from '../../services/fertilizerCalculator.js';
import { hectaresToAcres } from '../../utils/units.js';

export interface FertilizerSchedulePromptContext {
  farm: Farm;
  crop_name_en: string;
  duration_days_min: number;
  duration_days_max: number;
  stages_list: string;
  area_hectares: number;
  computed_products: CalculatedProductAllocation[];
  soilRatings: {
    nRating: SoilRating;
    pRating: SoilRating;
    kRating: SoilRating;
  };
  language: AppLanguage;
}

export function buildFertilizerSchedulePrompt(ctx: FertilizerSchedulePromptContext): string {
  const langMeta = LANGUAGE_LOOKUP[ctx.language] ?? LANGUAGE_LOOKUP.en;
  const acres = hectaresToAcres(ctx.area_hectares);

  const productTable = ctx.computed_products
    .map(p => `- ${p.name}: ${p.kg_total} kg total (${p.kg_per_ha} kg/ha, approx ${p.bags_50kg} bags of 50kg)`)
    .join('\n');

  return `TASK: Create a split-application schedule and simple explanation for the fertilizer quantities below. DO NOT change any quantity. Distribute each product's TOTAL across splits so the sum of splits equals the total exactly.

OUTPUT_LANGUAGE: ${langMeta.name} (${langMeta.code})
CROP: ${ctx.crop_name_en}; duration ${ctx.duration_days_min}–${ctx.duration_days_max} days; growth stages: ${ctx.stages_list}
AREA: ${ctx.area_hectares.toFixed(2)} ha (${acres.toFixed(2)} acres); soil: ${ctx.farm.soil_type}, pH ${ctx.farm.soil_ph ?? 'NA'}
IRRIGATION: ${ctx.farm.irrigation_source}
COMPUTED TOTALS (kg for whole area):
${productTable}
SOIL RATINGS: N ${ctx.soilRatings.nRating}, P ${ctx.soilRatings.pRating}, K ${ctx.soilRatings.kRating}

Rules: P and K products are normally applied fully as basal unless the crop practice differs; N is split across 2–4 stages. Mention micronutrients (e.g., zinc sulphate) only if justified by soil type/pH/crop, and mark them as "optional — confirm with soil test".
Return JSON matching the schema.`;
}
