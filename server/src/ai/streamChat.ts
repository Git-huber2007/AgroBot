import type { Response, Request } from 'express';
import { HarmBlockThreshold, HarmCategory } from '@google/genai';
import { genai } from './client.js';
import { logger } from '../utils/logger.js';
import { logAiUsage } from './aiLogger.js';

export interface StreamChatParams {
  req: Request;
  res: Response;
  model: string;
  systemInstruction: string;
  messages: Array<{
    role: 'user' | 'model';
    parts: Array<{ text: string }>;
  }>;
  temperature: number;
  maxOutputTokens: number;
  userId: string;
  requestId: string;
}

export async function streamChat(params: StreamChatParams): Promise<string> {
  const {
    req,
    res,
    model,
    systemInstruction,
    messages,
    temperature,
    maxOutputTokens,
    userId,
    requestId,
  } = params;

  // Set SSE response headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders?.();

  let clientDisconnected = false;
  req.on('close', () => {
    clientDisconnected = true;
  });

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

  let fullResponseText = '';
  const startTime = Date.now();

  try {
    const stream = await genai.models.generateContentStream({
      model,
      contents: messages,
      config: {
        systemInstruction,
        temperature,
        maxOutputTokens,
        safetySettings,
      },
    });

    for await (const chunk of stream) {
      if (clientDisconnected) {
        break;
      }
      const text = chunk.text ?? '';
      if (text) {
        fullResponseText += text;
        res.write(`event: token\ndata: ${JSON.stringify({ t: text })}\n\n`);
      }
    }

    const latencyMs = Date.now() - startTime;
    await logAiUsage({
      userId,
      feature: 'chat',
      model,
      status: 'success',
      latencyMs,
      requestId,
    });

    return fullResponseText;
  } catch (err: unknown) {
    const latencyMs = Date.now() - startTime;
    logger.error({ err, requestId }, 'Chat streaming interrupted or failed');

    await logAiUsage({
      userId,
      feature: 'chat',
      model,
      status: 'api_error',
      latencyMs,
      errorCode: err instanceof Error ? err.name : 'STREAM_ERROR',
      requestId,
    });

    if (!res.headersSent) {
      res.status(502).json({
        error: {
          code: 'AI_STREAM_ERROR',
          message: 'Chat service interrupted. Please try again.',
          requestId,
        },
      });
    } else {
      res.write(
        `event: error\ndata: ${JSON.stringify({ message: 'Chat stream interrupted.' })}\n\n`,
      );
      res.end();
    }

    throw err;
  }
}
