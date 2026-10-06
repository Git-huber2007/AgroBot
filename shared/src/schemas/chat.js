import { z } from 'zod';
import { CHAT_ROLES } from '../constants/enums.js';
import { LanguageSchema, SafeText, UuidSchema } from './common.js';
export const ChatRoleSchema = z.enum(CHAT_ROLES);
export const ChatSessionCreateSchema = z
    .object({
    farmId: UuidSchema.optional().nullable(),
    language: LanguageSchema,
})
    .strict();
export const ChatMessageSchema = z
    .object({
    content: SafeText(2000).refine(s => s.length >= 1, 'Message cannot be empty'),
})
    .strict();
export const ChatSessionUpdateSchema = z
    .object({
    title: SafeText(80).refine(s => s.length >= 1, 'Title cannot be empty'),
})
    .strict();
export const ChatSessionSchema = z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    farm_id: z.string().uuid().nullable(),
    title: z.string(),
    language: LanguageSchema,
    context_summary: z.string().nullable(),
    created_at: z.string(),
    updated_at: z.string(),
});
export const ChatMessageRecordSchema = z.object({
    id: z.number().int(),
    session_id: z.string().uuid(),
    user_id: z.string().uuid(),
    role: ChatRoleSchema,
    content: z.string(),
    created_at: z.string(),
});
