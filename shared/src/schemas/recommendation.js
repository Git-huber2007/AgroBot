import { z } from 'zod';
import { LanguageSchema, SeasonSchema, UuidSchema, WaterLevelSchema } from './common.js';
export const RecommendationRequestBaseSchema = z
    .object({
    farm_id: UuidSchema,
    season: SeasonSchema,
    sowing_month: z.number().int().min(1).max(12),
    water_availability: WaterLevelSchema,
    budget_min_inr_per_acre: z
        .number()
        .int()
        .min(0, 'Minimum budget must be at least 0')
        .max(500000, 'Minimum budget exceeds 5,00,000'),
    budget_max_inr_per_acre: z
        .number()
        .int()
        .min(0, 'Maximum budget must be at least 0')
        .max(500000, 'Maximum budget exceeds 5,00,000'),
    risk_appetite: z.enum(['low', 'medium', 'high']),
    market_access: z.enum(['local', 'mandi', 'contract', 'export']),
    previous_crop_id: z.number().int().positive().optional().nullable(),
    language: LanguageSchema,
})
    .strict();
export const RecommendationRequestSchema = RecommendationRequestBaseSchema.refine((data) => data.budget_min_inr_per_acre <= data.budget_max_inr_per_acre, {
    message: 'Minimum budget cannot exceed maximum budget',
    path: ['budget_min_inr_per_acre'],
});
export const RecommendationRecordSchema = z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    farm_id: z.string().uuid(),
    season: SeasonSchema,
    sowing_month: z.number().int(),
    water_availability: WaterLevelSchema,
    budget_min_inr_per_acre: z.number().int(),
    budget_max_inr_per_acre: z.number().int(),
    risk_appetite: z.string(),
    market_access: z.string(),
    previous_crop_id: z.number().int().nullable(),
    language: LanguageSchema,
    result: z.any(),
    model: z.string(),
    prompt_version: z.string(),
    created_at: z.string(),
});
