import { z } from 'zod';
export const ChatTitleSchema = z.object({
    title: z.string().max(80),
});
export const ChatSummarySchema = z.object({
    summary: z.string().max(1000),
});
