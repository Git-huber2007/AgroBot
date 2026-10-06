import { z } from 'zod';
import { IsoDate, LanguageSchema, SafeText, SeasonSchema, UuidSchema } from './common.js';

export const AdvisoryRequestBaseSchema = z
  .object({
    farm_id: UuidSchema,
    crop_id: z.number().int().positive('Crop selection is required'),
    variety: SafeText(60).optional(),
    sowing_date: IsoDate,
    growth_stage: z.string().min(1, 'Growth stage is required'),
    season: SeasonSchema,
    concern: SafeText(500).optional(),
    language: LanguageSchema,
  })
  .strict();

export const AdvisoryRequestSchema = AdvisoryRequestBaseSchema.superRefine(
  (data: z.infer<typeof AdvisoryRequestBaseSchema>, ctx) => {
    const sowingTime = new Date(data.sowing_date).getTime();
    const nowTime = Date.now();
    const diffDays = (sowingTime - nowTime) / (1000 * 60 * 60 * 24);

    if (diffDays > 30) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Sowing date cannot be more than 30 days in the future',
        path: ['sowing_date'],
      });
    }
    if (diffDays < -400) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Sowing date cannot be more than 400 days in the past',
        path: ['sowing_date'],
      });
    }
  },
);

export type AdvisoryRequestInput = z.infer<typeof AdvisoryRequestSchema>;

export const AdvisoryRecordSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  farm_id: z.string().uuid(),
  crop_id: z.number().int(),
  variety: z.string().nullable(),
  sowing_date: z.string(),
  growth_stage: z.string(),
  season: SeasonSchema,
  concern: z.string().nullable(),
  language: LanguageSchema,
  weather_snapshot: z.any().nullable(),
  result: z.any(),
  model: z.string(),
  prompt_version: z.string(),
  created_at: z.string(),
});

export type AdvisoryRecord = z.infer<typeof AdvisoryRecordSchema>;
