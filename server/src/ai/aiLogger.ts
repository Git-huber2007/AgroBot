import type { AiFeature, AiStatus } from '@cropsage/shared';
import { supabaseAdmin } from '../db/adminClient.js';
import { logger } from '../utils/logger.js';

export interface AiUsageLogEntry {
  userId?: string | null;
  feature: AiFeature;
  model: string;
  status: AiStatus;
  inputTokens?: number | null;
  outputTokens?: number | null;
  latencyMs: number;
  errorCode?: string | null;
  requestId?: string;
}

/**
 * Persists strictly anonymized AI generation metadata to `ai_usage_logs`.
 * Under NO circumstances are raw prompts, user texts, or images logged (§13.3).
 */
export async function logAiUsage(entry: AiUsageLogEntry): Promise<void> {
  try {
    await supabaseAdmin.from('ai_usage_logs').insert({
      user_id: entry.userId || null,
      feature: entry.feature,
      model: entry.model,
      status: entry.status,
      input_tokens: entry.inputTokens || null,
      output_tokens: entry.outputTokens || null,
      latency_ms: entry.latencyMs,
      error_code: entry.errorCode || null,
      request_id: entry.requestId || null,
    });
  } catch (err) {
    logger.warn({ err, feature: entry.feature }, 'Failed to record AI usage telemetry row');
  }
}
