import {
  HarmBlockThreshold,
  HarmCategory,
  type Part,
  type Schema,
} from '@google/genai';
import type { AiFeature } from '@cropsage/shared';
import type { ZodType } from 'zod';
import { AiError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { logAiUsage } from './aiLogger.js';
import { genai as defaultGenaiClient } from './client.js';

export interface GenerateStructuredArgs<T> {
  feature: AiFeature;
  userId?: string | null;
  requestId: string;
  model: string;
  systemInstruction: string;
  parts: Part[];
  responseSchema: Schema;
  zodSchema: ZodType<T>;
  temperature: number;
  maxOutputTokens: number;
  timeoutMs: number;
  maxRetries: number;
  postValidate?: (data: T) => string | null;
  customClient?: typeof defaultGenaiClient;
}

export interface GenerateStructuredResult<T> {
  data: T;
  model: string;
  usage?: {
    promptTokens?: number;
    candidatesTokens?: number;
  };
}

export async function generateStructured<T>(
  args: GenerateStructuredArgs<T>,
): Promise<GenerateStructuredResult<T>> {
  const {
    feature,
    userId,
    requestId,
    model,
    systemInstruction,
    parts,
    responseSchema,
    zodSchema,
    temperature,
    maxOutputTokens,
    timeoutMs,
    maxRetries = 1,
    postValidate,
    customClient = defaultGenaiClient,
  } = args;

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ];

  let currentParts = [...parts];
  let attempts = 0;
  const maxAttempts = 1 + maxRetries;

  while (attempts < maxAttempts) {
    attempts++;
    const startTime = Date.now();

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        const timer = setTimeout(() => {
          const timeoutErr = new Error('AI Timeout');
          timeoutErr.name = 'TimeoutError';
          reject(timeoutErr);
        }, timeoutMs);
        timer.unref?.();
      });

      const generatePromise = customClient.models.generateContent({
        model,
        contents: [{ role: 'user', parts: currentParts }],
        config: {
          systemInstruction,
          temperature,
          maxOutputTokens,
          responseMimeType: 'application/json',
          responseSchema,
          safetySettings,
        },
      });

      const response = await Promise.race([generatePromise, timeoutPromise]);
      const latencyMs = Date.now() - startTime;
      const text = response.text?.trim();

      if (!text) {
        if (response.promptFeedback?.blockReason) {
          await logAiUsage({
            userId,
            feature,
            model,
            status: 'blocked',
            latencyMs,
            errorCode: 'BLOCK_REASON_' + response.promptFeedback.blockReason,
            requestId,
          });
          throw new AiError('AI_BLOCKED', 502, 'The prompt was blocked by safety systems.');
        }
        throw new AiError('AI_UPSTREAM', 502, 'Empty response received from AI model.');
      }

      // Parse JSON
      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(text);
      } catch (jsonErr) {
        logger.warn({ jsonErr, requestId, attempt: attempts }, 'Failed to parse AI JSON output');
        if (attempts < maxAttempts) {
          currentParts.push({
            text: 'Your previous response was not valid JSON. Please return ONLY a valid, parseable JSON object matching the schema exactly.',
          });
          continue;
        }
        await logAiUsage({
          userId,
          feature,
          model,
          status: 'schema_error',
          latencyMs,
          errorCode: 'JSON_PARSE_ERROR',
          requestId,
        });
        throw new AiError('AI_SCHEMA_ERROR', 502, 'AI model output could not be parsed as JSON.');
      }

      // Validate against Zod schema
      const zodResult = zodSchema.safeParse(parsedJson);
      if (!zodResult.success) {
        const issuesSummary = zodResult.error.issues
          .slice(0, 3)
          .map(i => `${i.path.join('.')}: ${i.message}`)
          .join('; ')
          .substring(0, 500);

        logger.warn({ issuesSummary, requestId, attempt: attempts }, 'AI output failed Zod validation');

        if (attempts < maxAttempts) {
          currentParts.push({
            text: `Your previous response had schema validation errors: ${issuesSummary}. Return ONLY valid JSON strictly adhering to the schema.`,
          });
          continue;
        }

        await logAiUsage({
          userId,
          feature,
          model,
          status: 'schema_error',
          latencyMs,
          errorCode: 'ZOD_VALIDATION_ERROR',
          requestId,
        });
        throw new AiError('AI_SCHEMA_ERROR', 502, 'AI output failed schema validation requirements.');
      }

      // Business rule post-validation
      if (postValidate) {
        const postValError = postValidate(zodResult.data);
        if (postValError) {
          logger.warn({ postValError, requestId, attempt: attempts }, 'AI output failed postValidate');
          if (attempts < maxAttempts) {
            currentParts.push({
              text: `Correction required: ${postValError}. Please adjust and return corrected JSON.`,
            });
            continue;
          }
          await logAiUsage({
            userId,
            feature,
            model,
            status: 'schema_error',
            latencyMs,
            errorCode: 'POST_VALIDATE_ERROR',
            requestId,
          });
          throw new AiError('AI_SCHEMA_ERROR', 502, postValError);
        }
      }

      // Success
      await logAiUsage({
        userId,
        feature,
        model,
        status: 'success',
        inputTokens: response.usageMetadata?.promptTokenCount,
        outputTokens: response.usageMetadata?.candidatesTokenCount,
        latencyMs,
        requestId,
      });

      return {
        data: zodResult.data,
        model,
        usage: {
          promptTokens: response.usageMetadata?.promptTokenCount,
          candidatesTokens: response.usageMetadata?.candidatesTokenCount,
        },
      };
    } catch (err: unknown) {
      const latencyMs = Date.now() - startTime;
      if (err instanceof AiError) {
        throw err;
      }

      const isTimeout =
        (err instanceof Error && err.name === 'TimeoutError') ||
        (err instanceof Error && err.message.toLowerCase().includes('timeout'));

      if (isTimeout) {
        await logAiUsage({
          userId,
          feature,
          model,
          status: 'timeout',
          latencyMs,
          errorCode: 'TIMEOUT',
          requestId,
        });
        throw new AiError('AI_TIMEOUT', 504, 'AI model generation timed out. Please try again.');
      }

      logger.error({ err, requestId }, 'Upstream Google GenAI SDK call failed');
      await logAiUsage({
        userId,
        feature,
        model,
        status: 'api_error',
        latencyMs,
        errorCode: err instanceof Error ? err.name : 'UNKNOWN_API_ERROR',
        requestId,
      });

      throw new AiError('AI_UPSTREAM', 502, 'Our AI agronomy advisor is temporarily busy. Please try again in a few moments.');
    }
  }

  throw new AiError('AI_SCHEMA_ERROR', 502, 'Could not produce valid advisory after retries.');
}
