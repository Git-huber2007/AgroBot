import { env } from './env.js';

export interface AiFeatureConfig {
  model: string;
  temperature: number;
  maxOutputTokens: number;
  timeoutMs: number;
  maxRetries: number;
}

export const AI_CONFIGS = {
  crop_advisory: {
    model: env.GEMINI_MODEL_TEXT,
    temperature: 0.3,
    maxOutputTokens: 4096,
    timeoutMs: 45_000,
    maxRetries: 1,
  },
  crop_recommendation: {
    model: env.GEMINI_MODEL_TEXT,
    temperature: 0.4,
    maxOutputTokens: 4096,
    timeoutMs: 45_000,
    maxRetries: 1,
  },
  pest_diagnosis: {
    model: env.GEMINI_MODEL_VISION,
    temperature: 0.2,
    maxOutputTokens: 4096,
    timeoutMs: 60_000,
    maxRetries: 1,
  },
  fertilizer_plan: {
    model: env.GEMINI_MODEL_TEXT,
    temperature: 0.2,
    maxOutputTokens: 2048,
    timeoutMs: 30_000,
    maxRetries: 1,
  },
  chat: {
    model: env.GEMINI_MODEL_CHAT,
    temperature: 0.6,
    maxOutputTokens: 1536,
    timeoutMs: 60_000,
    maxRetries: 0,
  },
  chat_housekeeping: {
    model: env.GEMINI_MODEL_TEXT,
    temperature: 0.2,
    maxOutputTokens: 512,
    timeoutMs: 20_000,
    maxRetries: 1,
  },
} as const satisfies Record<string, AiFeatureConfig>;
