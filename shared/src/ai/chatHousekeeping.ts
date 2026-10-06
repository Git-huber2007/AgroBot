import { z } from 'zod';

export const ChatTitleSchema = z.object({
  title: z.string().max(80),
});

export type ChatTitleResult = z.infer<typeof ChatTitleSchema>;

export const ChatSummarySchema = z.object({
  summary: z.string().max(1000),
});

export type ChatSummaryResult = z.infer<typeof ChatSummarySchema>;
