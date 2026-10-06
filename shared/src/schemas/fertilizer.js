import { z } from 'zod';
import { FERTILIZER_KEYS } from '../constants/fertilizers.js';
import { LanguageSchema, UuidSchema } from './common.js';
export const FertilizerProductEnum = z.enum(FERTILIZER_KEYS);
export const FertilizerRequestSchema = z
    .object({
    farm_id: UuidSchema,
    crop_id: z.number().int().positive('Crop is required'),
    area_hectares: z.number().positive('Area must be greater than 0'),
    target_yield_t_ha: z.number().min(0).max(200).optional().nullable(),
    available_fertilizers: z
        .array(FertilizerProductEnum)
        .min(1, 'Please select at least one available fertilizer product'),
    soil_n: z.number().min(0).max(2000).optional().nullable(),
    soil_p: z.number().min(0).max(2000).optional().nullable(),
    soil_k: z.number().min(0).max(2000).optional().nullable(),
    language: LanguageSchema,
})
    .strict();
export const ComputedQuantityItemSchema = z.object({
    fertilizerKey: FertilizerProductEnum,
    name: z.string(),
    kg_per_ha: z.number(),
    kg_total: z.number(),
    kg_per_acre: z.number(),
    bags_50kg: z.number(),
});
export const FertilizerPlanRecordSchema = z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    farm_id: z.string().uuid(),
    crop_id: z.number().int(),
    area_hectares: z.number(),
    target_yield_t_ha: z.number().nullable(),
    inputs: z.any(),
    computed_quantities: z.array(ComputedQuantityItemSchema),
    ai_schedule: z.any(),
    language: LanguageSchema,
    model: z.string(),
    prompt_version: z.string(),
    created_at: z.string(),
});
