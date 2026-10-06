import { z } from 'zod';
import { IsoDate, RecordTypeSchema, UuidSchema } from './common.js';
export const HistoryQuerySchema = z
    .object({
    type: RecordTypeSchema.optional(),
    farmId: UuidSchema.optional(),
    cropId: z.coerce.number().int().positive().optional(),
    from: IsoDate.optional(),
    to: IsoDate.optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(20),
})
    .superRefine((data, ctx) => {
    if (data.from && data.to && data.from > data.to) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "'from' date cannot be after 'to' date",
            path: ['from'],
        });
    }
});
export const HistoryItemSchema = z.object({
    id: z.string().uuid(),
    record_type: RecordTypeSchema,
    user_id: z.string().uuid(),
    farm_id: z.string().uuid().nullable(),
    crop_id: z.number().int().nullable(),
    title_hint: z.string().nullable(),
    created_at: z.string(),
    farm_name: z.string().optional(),
    crop_name: z.string().optional(),
    feedback: z
        .object({
        is_helpful: z.boolean(),
        comment: z.string().nullable(),
    })
        .optional(),
});
