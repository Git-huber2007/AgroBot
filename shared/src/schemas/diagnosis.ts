import { z } from 'zod';
import { AffectedPartSchema, LanguageSchema, SafeText, UuidSchema } from './common.js';

export const DiagnosisRequestBaseSchema = z
  .object({
    farm_id: UuidSchema.optional().nullable(),
    crop_id: z.number().int().positive('Crop selection is required'),
    affected_part: AffectedPartSchema,
    symptoms: SafeText(800).optional().nullable(),
    language: LanguageSchema,
    imageCount: z.number().int().min(0).max(3).default(0),
  })
  .strict();

export const DiagnosisRequestSchema = DiagnosisRequestBaseSchema.superRefine(
  (data: z.infer<typeof DiagnosisRequestBaseSchema>, ctx) => {
    const hasImage = data.imageCount > 0;
    const hasSymptoms = (data.symptoms ? data.symptoms.length : 0) >= 20;
    if (!hasImage && !hasSymptoms) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please either upload at least 1 image or describe the symptoms in at least 20 characters',
        path: ['symptoms'],
      });
    }
  },
);

export type DiagnosisRequestInput = z.infer<typeof DiagnosisRequestSchema>;

export const DiagnosisImageSchema = z.object({
  id: z.string().uuid(),
  diagnosis_id: z.string().uuid(),
  user_id: z.string().uuid(),
  storage_path: z.string(),
  mime_type: z.string(),
  size_bytes: z.number().int(),
  created_at: z.string(),
  signed_url: z.string().optional(),
});

export type DiagnosisImage = z.infer<typeof DiagnosisImageSchema>;

export const DiagnosisRecordSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  farm_id: z.string().uuid().nullable(),
  crop_id: z.number().int(),
  affected_part: AffectedPartSchema,
  symptoms: z.string().nullable(),
  language: LanguageSchema,
  result: z.any(),
  top_confidence: z.number().nullable(),
  model: z.string(),
  prompt_version: z.string(),
  created_at: z.string(),
  images: z.array(DiagnosisImageSchema).optional(),
});

export type DiagnosisRecord = z.infer<typeof DiagnosisRecordSchema>;
