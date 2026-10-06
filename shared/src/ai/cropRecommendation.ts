import { z } from 'zod';

export const RankedCropRecommendationSchema = z.object({
  rank: z.number().int().min(1).max(5),
  crop_name: z.string(),
  crop_id: z.number().int().optional(),
  suitability_score: z.number().int().min(0).max(100),
  reasons: z.array(z.string()).min(2).max(5),
  duration_days: z.string(),
  water_requirement: z.enum(['low', 'medium', 'high']),
  input_cost_inr_per_acre: z.object({
    min: z.number().int().min(0),
    max: z.number().int().min(0),
  }),
  expected_yield: z.string(),
  key_risks: z.array(z.string()).max(4),
  rotation_benefit: z.string(),
  suggested_varieties: z.array(z.string()).max(4),
  sowing_window: z.string(),
});

export const CropRecommendationResultSchema = z.object({
  summary: z.string(),
  recommendations: z.array(RankedCropRecommendationSchema).min(3).max(5),
  general_tips: z.array(z.string()).max(5),
  confidence: z.enum(['low', 'medium', 'high']),
  assumptions: z.array(z.string()).max(5),
});

export type CropRecommendationResult = z.infer<typeof CropRecommendationResultSchema>;
export type RankedCropRecommendation = z.infer<typeof RankedCropRecommendationSchema>;
