import { z } from 'zod';
import { LanguageSchema, SafeText } from './common.js';
export const ProfileUpdateSchema = z
    .object({
    full_name: SafeText(80)
        .refine(s => s.length === 0 || s.length >= 2, 'Full name must be at least 2 characters')
        .optional(),
    phone: z
        .string()
        .trim()
        .regex(/^\+?[0-9]{10,13}$/, 'Phone number must be 10-13 digits')
        .optional()
        .or(z.literal('')),
    preferred_language: LanguageSchema.optional(),
    state: SafeText(60).optional(),
    district: SafeText(60).optional(),
})
    .strict();
export const ProfileSchema = z.object({
    id: z.string().uuid(),
    full_name: z.string().nullable(),
    phone: z.string().nullable(),
    preferred_language: LanguageSchema,
    state: z.string().nullable(),
    district: z.string().nullable(),
    onboarding_completed: z.boolean(),
    created_at: z.string(),
    updated_at: z.string(),
});
