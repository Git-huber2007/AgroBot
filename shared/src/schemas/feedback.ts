import { z } from 'zod';
import { RecordTypeSchema, SafeText, UuidSchema } from './common.js';

export const FeedbackSchema = z
  .object({
    record_type: RecordTypeSchema,
    record_id: UuidSchema,
    is_helpful: z.boolean(),
    comment: SafeText(500).optional().nullable(),
  })
  .strict();

export type FeedbackInput = z.infer<typeof FeedbackSchema>;

export const FeedbackRecordSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  record_type: RecordTypeSchema,
  record_id: z.string().uuid(),
  is_helpful: z.boolean(),
  comment: z.string().nullable(),
  created_at: z.string(),
});

export type FeedbackRecord = z.infer<typeof FeedbackRecordSchema>;
