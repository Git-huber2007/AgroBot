import { z } from 'zod';
import { DIAGNOSIS_CATEGORIES } from '../constants/enums.js';

export const DiagnosisCategoryEnum = z.enum(DIAGNOSIS_CATEGORIES);

export const ImageAssessmentSchema = z.object({
  is_plant: z.boolean(),
  quality: z.enum(['good', 'acceptable', 'poor', 'not_applicable']),
  issues: z.array(z.string()).max(4),
});

export const PrimaryDiagnosisSchema = z.object({
  name: z.string(),
  local_name: z.string(),
  category: DiagnosisCategoryEnum,
  confidence: z.number().min(0).max(1),
  severity: z.enum(['none', 'low', 'moderate', 'high', 'critical']),
  observed_symptoms: z.array(z.string()).max(6),
  cause: z.string(),
  spread_risk: z.enum(['low', 'medium', 'high']),
});

export const DifferentialDiagnosisSchema = z.object({
  name: z.string(),
  category: DiagnosisCategoryEnum,
  confidence: z.number().min(0).max(1),
  distinguishing_features: z.string(),
});

export const BiologicalOrganicTreatmentSchema = z.object({
  name: z.string(),
  dose: z.string(),
  method: z.string(),
});

export const ChemicalTreatmentSchema = z.object({
  active_ingredient: z.string(),
  formulation: z.string(),
  dose_per_litre: z.string(),
  dose_per_acre: z.string(),
  application_method: z.string(),
  pre_harvest_interval_days: z.number().int().nullable(),
  safety_precautions: z.array(z.string()).min(2).max(5),
});

export const TreatmentLadderSchema = z.object({
  urgency: z.enum(['immediate', 'within_3_days', 'within_week', 'monitor_only']),
  cultural: z.array(z.string()).max(5),
  biological_organic: z.array(BiologicalOrganicTreatmentSchema).max(4),
  chemical: z.array(ChemicalTreatmentSchema).max(3),
});

export const PestDiagnosisResultSchema = z.object({
  image_assessment: ImageAssessmentSchema,
  primary_diagnosis: PrimaryDiagnosisSchema,
  differential_diagnoses: z.array(DifferentialDiagnosisSchema).max(3),
  treatment: TreatmentLadderSchema,
  prevention: z.array(z.string()).max(6),
  when_to_consult_expert: z.string(),
  retake_photo_tips: z.array(z.string()).max(4),
  confidence_note: z.string(),
});

export type PestDiagnosisResult = z.infer<typeof PestDiagnosisResultSchema>;
export type PrimaryDiagnosis = z.infer<typeof PrimaryDiagnosisSchema>;
export type TreatmentLadder = z.infer<typeof TreatmentLadderSchema>;
