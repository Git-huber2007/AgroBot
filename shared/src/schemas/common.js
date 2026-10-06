import { z } from 'zod';
import { LANGUAGE_CODES, SEASONS, SOIL_TYPES, IRRIGATION_SOURCES, WATER_LEVELS, FARMING_PRACTICES, AREA_UNITS, RECORD_TYPES, AFFECTED_PARTS, } from '../constants/index.js';
export const LanguageSchema = z.enum(LANGUAGE_CODES);
export const SeasonSchema = z.enum(SEASONS);
export const SoilTypeSchema = z.enum(SOIL_TYPES);
export const IrrigationSchema = z.enum(IRRIGATION_SOURCES);
export const WaterLevelSchema = z.enum(WATER_LEVELS);
export const FarmingPracticeSchema = z.enum(FARMING_PRACTICES);
export const AreaUnitSchema = z.enum(AREA_UNITS);
export const RecordTypeSchema = z.enum(RECORD_TYPES);
export const AffectedPartSchema = z.enum(AFFECTED_PARTS);
export const UuidSchema = z.string().uuid();
export const SafeText = (max) => z
    .string()
    .trim()
    .max(max)
    .transform(s => s
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/<<<|>>>/g, ''));
export const IsoDate = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be an ISO date formatted as YYYY-MM-DD')
    .refine(d => !Number.isNaN(Date.parse(d)), 'Invalid calendar date');
export const IdParamSchema = z
    .object({
    id: UuidSchema,
})
    .strict();
