import type { Request, Response } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  ChatSummarySchema,
  ChatTitleSchema,
  type AppLanguage,
  type ChatMessageInput,
  type ChatSessionCreateInput,
  type Farm,
} from '@cropsage/shared';
import { AI_CONFIGS } from '../config/ai.js';
import { streamChat } from '../ai/streamChat.js';
import { buildChatSystemInstruction } from '../ai/prompts/chat.js';
import {
  buildChatSummaryPrompt,
  buildChatTitlingPrompt,
} from '../ai/prompts/chatHousekeeping.js';
import { generateStructured } from '../ai/generateStructured.js';
import {
  chatSummaryGeminiSchema,
  chatTitleGeminiSchema,
} from '../ai/schemas/chatHousekeeping.schema.js';
import { sanitizeUserInput } from '../ai/safety/sanitizeUserInput.js';
import { NotFoundError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export class ChatService {
  public static async createSession(
    userClient: SupabaseClient,
    userId: string,
    input: ChatSessionCreateInput,
  ) {
    const { data: session, error } = await userClient
      .from('chat_sessions')
      .insert({
        user_id: userId,
        farm_id: input.farmId || null,
        language: input.language,
        title: 'New conversation',
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to create chat session: ${error.message}`);
    }

    return session;
  }

  public static async sendMessageAndStream(
    userClient: SupabaseClient,
    userId: string,
    requestId: string,
    sessionId: string,
    input: ChatMessageInput,
    req: Request,
    res: Response,
  ) {
    // 1. Fetch Session (RLS verifies ownership)
    const { data: session, error: sessErr } = await userClient
      .from('chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();

    if (sessErr || !session) {
      throw new NotFoundError('Chat session not found or you do not have permission.');
    }

    // 2. Fetch Farm context if session is attached to a farm
    let farm: Farm | null = null;
    let latestAdvisorySummary: string | null = null;

    if (session.farm_id) {
      const { data: farmData } = await userClient
        .from('farms')
        .select('*')
        .eq('id', session.farm_id)
        .maybeSingle();
      if (farmData) farm = farmData as Farm;

      const { data: adv } = await userClient
        .from('crop_advisories')
        .select('result')
        .eq('farm_id', session.farm_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (adv?.result?.summary) {
        latestAdvisorySummary = adv.result.summary;
      }
    }

    // 3. Save User Message to Database
    const cleanContent = sanitizeUserInput(input.content);
    const { data: userMessageRow, error: userMsgErr } = await userClient
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        user_id: userId,
        role: 'user',
        content: cleanContent,
      })
      .select('id')
      .single();

    if (userMsgErr) {
      throw new Error(`Failed to record chat message: ${userMsgErr.message}`);
    }

    // 4. Load last 20 messages for active context
    const { data: rawMessages } = await userClient
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(20);

    const orderedMessages = (rawMessages || []).reverse();

    // Map into Gemini contents with user input delimiter wrapping (§15.5)
    const geminiMessages = orderedMessages.map(m => {
      const isUser = m.role === 'user';
      const text = isUser
        ? `<<<USER_INPUT>>>\n${m.content}\n<<<END_USER_INPUT>>>`
        : m.content;

      return {
        role: isUser ? ('user' as const) : ('model' as const),
        parts: [{ text }],
      };
    });

    // 5. Build system instruction with active farm & earlier summary
    const systemInstruction = buildChatSystemInstruction({
      farm,
      latest_advisory_summary: latestAdvisorySummary,
      context_summary: session.context_summary,
      language: session.language as AppLanguage,
    });

    const config = AI_CONFIGS.chat;

    // 6. Stream SSE response to client
    const fullAssistantReply = await streamChat({
      req,
      res,
      model: config.model,
      systemInstruction,
      messages: geminiMessages,
      temperature: config.temperature,
      maxOutputTokens: config.maxOutputTokens,
      userId,
      requestId,
    });

    // 7. Persist Model Message to DB
    const { data: modelMsgRow } = await userClient
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        user_id: userId,
        role: 'model',
        content: fullAssistantReply,
      })
      .select('id')
      .single();

    // Send closing event
    res.write(
      `event: done\ndata: ${JSON.stringify({ messageId: modelMsgRow?.id, userMessageId: userMessageRow?.id })}\n\n`,
    );
    res.end();

    // 8. Background Housekeeping (§15.6)
    // Run asynchronously without blocking response
    this.runBackgroundHousekeeping(
      userClient,
      userId,
      requestId,
      sessionId,
      session.language as AppLanguage,
      cleanContent,
      fullAssistantReply,
      orderedMessages.length,
      session.context_summary,
    ).catch(err => {
      logger.warn({ err, sessionId }, 'Error in chat housekeeping background task');
    });
  }

  private static async runBackgroundHousekeeping(
    userClient: SupabaseClient,
    userId: string,
    requestId: string,
    sessionId: string,
    language: AppLanguage,
    lastUserText: string,
    lastAssistantText: string,
    messageCount: number,
    existingSummary: string | null,
  ): Promise<void> {
    const config = AI_CONFIGS.chat_housekeeping;

    // 1. Auto-Title on first exchange
    if (messageCount <= 2) {
      try {
        const titlePrompt = buildChatTitlingPrompt(lastUserText, lastAssistantText, language);
        const result = await generateStructured<{ title: string }>({
          feature: 'chat',
          userId,
          requestId,
          model: config.model,
          systemInstruction: 'You generate short titles for conversations.',
          parts: [{ text: titlePrompt }],
          responseSchema: chatTitleGeminiSchema,
          zodSchema: ChatTitleSchema,
          temperature: config.temperature,
          maxOutputTokens: config.maxOutputTokens,
          timeoutMs: config.timeoutMs,
          maxRetries: 0,
        });

        if (result.data.title) {
          await userClient
            .from('chat_sessions')
            .update({ title: result.data.title.substring(0, 80) })
            .eq('id', sessionId);
        }
      } catch (err) {
        logger.debug({ err }, 'Chat titling skipped');
      }
    }

    // 2. Summarize older conversation if messageCount exceeds 30
    if (messageCount > 30) {
      try {
        const { data: messagesForSummary } = await userClient
          .from('chat_messages')
          .select('role, content')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: false })
          .limit(30);

        if (messagesForSummary && messagesForSummary.length > 0) {
          const summaryPrompt = buildChatSummaryPrompt(
            existingSummary,
            messagesForSummary.reverse(),
          );
          const sumResult = await generateStructured<{ summary: string }>({
            feature: 'chat',
            userId,
            requestId,
            model: config.model,
            systemInstruction: 'You summarize agrarian chat histories concisely.',
            parts: [{ text: summaryPrompt }],
            responseSchema: chatSummaryGeminiSchema,
            zodSchema: ChatSummarySchema,
            temperature: config.temperature,
            maxOutputTokens: config.maxOutputTokens,
            timeoutMs: config.timeoutMs,
            maxRetries: 0,
          });

          if (sumResult.data.summary) {
            await userClient
              .from('chat_sessions')
              .update({ context_summary: sumResult.data.summary })
              .eq('id', sessionId);
          }
        }
      } catch (sumErr) {
        logger.debug({ sumErr }, 'Chat summarization skipped');
      }
    }
  }
}
