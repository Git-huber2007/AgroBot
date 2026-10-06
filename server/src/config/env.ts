import dotenv from 'dotenv';
import path from 'node:path';
import { z } from 'zod';

// Load .env from current directory or parent directory if present
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '..', '.env') });

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(8080),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:5173,https://*.vercel.app')
    .transform(s => s.split(',').map(item => item.trim()).filter(Boolean)),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  APP_VERSION: z.string().default('1.0.0'),

  // Supabase
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL (e.g. https://your-project.supabase.co)').default('https://example.supabase.co'),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY is required').default('dummy-anon-key-for-tests'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required').default('dummy-service-role-key-for-tests'),
  SUPABASE_STORAGE_BUCKET: z.string().default('crop-images'),

  // Google Gemini
  GEMINI_API_KEY: z.string().default('dummy-gemini-key-for-mock-or-test'),
  GEMINI_MODEL_TEXT: z.string().default('gemini-2.5-flash'),
  GEMINI_MODEL_VISION: z.string().default('gemini-2.5-flash'),
  GEMINI_MODEL_CHAT: z.string().default('gemini-2.5-flash'),

  // Weather
  OPEN_METEO_BASE_URL: z.string().url().default('https://api.open-meteo.com/v1/forecast'),
  WEATHER_CACHE_TTL_MINUTES: z.coerce.number().int().positive().default(30),

  // Quotas & Rate Limits
  AI_HOURLY_LIMIT_PER_USER: z.coerce.number().int().positive().default(20),
  AI_DAILY_QUOTA_PER_USER: z.coerce.number().int().positive().default(60),
  UPLOAD_DAILY_LIMIT_PER_USER: z.coerce.number().int().positive().default(30),

  // Test flags
  AI_MOCK: z
    .string()
    .optional()
    .transform(v => v === 'true' || v === '1'),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('\n❌ Fatal: Invalid or missing environment variables:\n');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  console.error('\nPlease verify your .env file against .env.example.\n');
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
