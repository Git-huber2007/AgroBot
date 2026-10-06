import { z } from 'zod';

export const TaskPriorityEnum = z.enum(['urgent', 'high', 'medium', 'low']);
export const TaskCategoryEnum = z.enum([
  'irrigation',
  'nutrition',
  'pest_management',
  'disease_management',
  'weed_management',
  'field_operation',
  'harvest',
  'other',
]);

export const PriorityTaskSchema = z.object({
  title: z.string(),
  description: z.string(),
  priority: TaskPriorityEnum,
  timing: z.string(),
  category: TaskCategoryEnum,
});

export const CropStageSchema = z.object({
  key: z.string(),
  name: z.string(),
  days_after_sowing: z.number().int().min(0),
  stage_description: z.string(),
});

export const IrrigationPlanSchema = z.object({
  recommendation: z.string(),
  frequency: z.string(),
  quantity_guidance: z.string(),
  weather_adjustment: z.string(),
});

export const NutrientPlanItemSchema = z.object({
  product: z.string(),
  dose_per_acre: z.string(),
  method: z.string(),
  timing: z.string(),
});

export const NutrientPlanSchema = z.object({
  recommendation: z.string(),
  items: z.array(NutrientPlanItemSchema).max(6),
});

export const PestWatchItemSchema = z.object({
  name: z.string(),
  type: z.enum(['insect_pest', 'disease', 'weed', 'nutrient_disorder', 'other']),
  risk_level: z.enum(['low', 'medium', 'high']),
  symptoms_to_watch: z.string(),
  preventive_action: z.string(),
});

export const WeatherAlertItemSchema = z.object({
  alert: z.string(),
  impact: z.string(),
  action: z.string(),
});

export const EstimatedCostSchema = z.object({
  min_inr_per_acre: z.number().int().min(0),
  max_inr_per_acre: z.number().int().min(0),
  notes: z.string(),
});

export const CropAdvisoryResultSchema = z.object({
  summary: z.string(),
  crop_stage: CropStageSchema,
  priority_tasks: z.array(PriorityTaskSchema).min(3).max(8),
  irrigation_plan: IrrigationPlanSchema,
  nutrient_plan: NutrientPlanSchema,
  pest_disease_watch: z.array(PestWatchItemSchema).max(5),
  weather_alerts: z.array(WeatherAlertItemSchema).max(5),
  dos: z.array(z.string()).min(2).max(6),
  donts: z.array(z.string()).min(2).max(6),
  estimated_cost: EstimatedCostSchema,
  confidence: z.enum(['low', 'medium', 'high']),
  consult_expert_when: z.array(z.string()).min(1).max(4),
  assumptions: z.array(z.string()).max(5),
});

export type CropAdvisoryResult = z.infer<typeof CropAdvisoryResultSchema>;
