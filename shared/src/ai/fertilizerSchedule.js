import { z } from 'zod';
export const SplitProductAllocationSchema = z.object({
    product: z.string(),
    kg_total: z.number().min(0),
});
export const FertilizerSplitStageSchema = z.object({
    stage: z.string(),
    days_after_sowing: z.string(),
    products: z.array(SplitProductAllocationSchema).min(1),
    method: z.string(),
    notes: z.string(),
});
export const FertilizerScheduleResultSchema = z.object({
    summary: z.string(),
    splits: z.array(FertilizerSplitStageSchema).min(1).max(5),
    organic_supplements: z.array(z.string()).max(4),
    micronutrient_advice: z.array(z.string()).max(3),
    application_tips: z.array(z.string()).max(5),
    warnings: z.array(z.string()).max(4),
    fallback: z.boolean().optional(),
});
