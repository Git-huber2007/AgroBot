import { z } from 'zod';
import {
  SoilTypeSchema,
  IrrigationSchema,
  WaterLevelSchema,
  FarmingPracticeSchema,
  AreaUnitSchema,
  SafeText,
  IsoDate,
} from './common.js';

export const FarmBaseSchema = z
  .object({
    name: SafeText(60).refine(s => s.length >= 2, 'Farm name must be between 2 and 60 characters'),
    state: SafeText(60).refine(s => s.length >= 2, 'State is required'),
    district: SafeText(60).refine(s => s.length >= 2, 'District is required'),
    village: SafeText(60).optional(),
    latitude: z
      .number()
      .min(6, 'Latitude must be within India bounds (6 to 38)')
      .max(38, 'Latitude must be within India bounds (6 to 38)')
      .optional()
      .nullable(),
    longitude: z
      .number()
      .min(68, 'Longitude must be within India bounds (68 to 98)')
      .max(98, 'Longitude must be within India bounds (68 to 98)')
      .optional()
      .nullable(),
    area_value: z
      .number()
      .positive('Area must be greater than 0')
      .max(10000, 'Area must be 10,000 or less'),
    area_unit: AreaUnitSchema,
    soil_type: SoilTypeSchema,
    irrigation_source: IrrigationSchema,
    water_availability: WaterLevelSchema,
    farming_practice: FarmingPracticeSchema.default('conventional'),
    soil_n: z.number().min(0).max(2000).optional().nullable(),
    soil_p: z.number().min(0).max(2000).optional().nullable(),
    soil_k: z.number().min(0).max(2000).optional().nullable(),
    soil_ph: z.number().min(3.0).max(10.5).optional().nullable(),
    soil_oc: z.number().min(0).max(5.0).optional().nullable(),
    soil_ec: z.number().min(0).max(20.0).optional().nullable(),
    soil_test_date: IsoDate.optional().nullable(),
    is_default: z.boolean().default(false),
  })
  .strict();

export const FarmCreateSchema = FarmBaseSchema.superRefine((data, ctx) => {
  const hasLat = data.latitude !== undefined && data.latitude !== null;
  const hasLng = data.longitude !== undefined && data.longitude !== null;
  if ((hasLat && !hasLng) || (!hasLat && hasLng)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Both latitude and longitude must be provided together',
      path: ['latitude'],
    });
  }
  if (data.soil_test_date) {
    const today = new Date().toISOString().split('T')[0]!;
    if (data.soil_test_date > today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Soil test date cannot be in the future',
        path: ['soil_test_date'],
      });
    }
  }
});

export type FarmCreateInput = z.infer<typeof FarmCreateSchema>;

export const FarmUpdateSchema = FarmBaseSchema.partial()
  .strict()
  .refine((obj: Record<string, unknown>) => Object.keys(obj).length > 0, {
    message: 'At least one field must be provided for update',
  });

export type FarmUpdateInput = z.infer<typeof FarmUpdateSchema>;

export const FarmSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string(),
  state: z.string(),
  district: z.string(),
  village: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  area_value: z.number(),
  area_unit: AreaUnitSchema,
  area_hectares: z.number(),
  soil_type: SoilTypeSchema,
  irrigation_source: IrrigationSchema,
  water_availability: WaterLevelSchema,
  farming_practice: FarmingPracticeSchema,
  soil_n: z.number().nullable(),
  soil_p: z.number().nullable(),
  soil_k: z.number().nullable(),
  soil_ph: z.number().nullable(),
  soil_oc: z.number().nullable(),
  soil_ec: z.number().nullable(),
  soil_test_date: z.string().nullable(),
  is_default: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Farm = z.infer<typeof FarmSchema>;
