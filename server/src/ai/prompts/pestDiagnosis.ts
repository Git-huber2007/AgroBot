import {
  LANGUAGE_LOOKUP,
  type AffectedPart,
  type AppLanguage,
  type FarmingPractice,
} from '@cropsage/shared';
import { formatDelimitedInput } from '../safety/sanitizeUserInput.js';

export interface PestDiagnosisPromptContext {
  crop_name_en: string;
  scientific_name?: string | null;
  affected_part: AffectedPart;
  district?: string | null;
  state?: string | null;
  current_month?: string | null;
  season_guess?: string | null;
  weather_short?: string | null;
  farming_practice?: FarmingPractice;
  image_count: number;
  symptoms?: string | null;
  language: AppLanguage;
}

export function buildPestDiagnosisPrompt(ctx: PestDiagnosisPromptContext): string {
  const langMeta = LANGUAGE_LOOKUP[ctx.language] ?? LANGUAGE_LOOKUP.en;

  return `TASK: Diagnose the plant health problem shown in the attached image(s) and/or described symptoms.

OUTPUT_LANGUAGE: ${langMeta.name} (${langMeta.code})
CROP: ${ctx.crop_name_en} (${ctx.scientific_name ?? 'N/A'})
AFFECTED PART: ${ctx.affected_part}
LOCATION / SEASON: ${ctx.district ?? 'Unknown District'}, ${ctx.state ?? 'India'} — ${ctx.current_month ?? 'Current Season'}, ${ctx.season_guess ?? 'Kharif/Rabi'}
RECENT WEATHER (if known): ${ctx.weather_short ?? 'unknown'}
FARMING PRACTICE: ${ctx.farming_practice ?? 'conventional'}
NUMBER OF IMAGES: ${ctx.image_count}

FARMER'S DESCRIPTION
${formatDelimitedInput(ctx.symptoms, 'No description provided.')}

INSTRUCTIONS
1. First assess the images: are they of a plant? Is the quality sufficient (focus, lighting, distance)? If NOT a plant, set image_assessment.is_plant=false, primary_diagnosis.category="unknown", confidence ≤ 0.2, and fill retake_photo_tips.
2. Consider the crop, part, region and season. Give ONE primary diagnosis and up to 3 differential diagnoses with distinguishing features.
3. confidence is a probability 0.0–1.0; be conservative. Use "healthy" if no problem is visible.
4. Treatment ladder: cultural → biological_organic → chemical (chemical only if severity is moderate or above; generic active ingredients only; include PHI and PPE). If farming practice is organic/natural, chemical MUST be an empty array.
5. Never claim certainty you do not have. Always fill when_to_consult_expert.
Return JSON matching the schema.`;
}
