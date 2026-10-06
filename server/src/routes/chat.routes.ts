import { Router } from 'express';
import {
  ChatMessageSchema,
  ChatSessionCreateSchema,
  ChatSessionUpdateSchema,
  IdParamSchema,
} from '@cropsage/shared';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';
import { aiHourlyLimiter } from '../middleware/rateLimiters.js';
import { checkAiDailyQuota } from '../middleware/aiQuota.js';
import { ChatService } from '../services/chat.service.js';
import { NotFoundError } from '../utils/errors.js';

export const chatRouter = Router();

// GET /chat/sessions
chatRouter.get('/chat/sessions', requireAuth, async (req, res, next) => {
  try {
    const { data: sessions, error } = await req.supabase!
      .from('chat_sessions')
      .select('*, farms(name)')
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to list chat sessions: ${error.message}`);
    }

    const mapped = (sessions || []).map(s => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const farmObj = (Array.isArray(s.farms) ? s.farms[0] : s.farms) as any;
      return {
        ...s,
        farm: farmObj || null,
        farm_name: farmObj?.name || null,
      };
    });

    res.json({ data: mapped });
  } catch (err) {
    next(err);
  }
});

// POST /chat/sessions
chatRouter.post(
  '/chat/sessions',
  requireAuth,
  validate({ body: ChatSessionCreateSchema }),
  async (req, res, next) => {
    try {
      const session = await ChatService.createSession(
        req.supabase!,
        req.user!.id,
        req.body,
      );
      res.status(201).json({ data: session });
    } catch (err) {
      next(err);
    }
  },
);

// GET /chat/sessions/:id/messages
chatRouter.get(
  '/chat/sessions/:id/messages',
  requireAuth,
  validate({ params: IdParamSchema }),
  async (req, res, next) => {
    try {
      const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 50));
      let query = req.supabase!
        .from('chat_messages')
        .select('*')
        .eq('session_id', req.params.id)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (req.query.before && typeof req.query.before === 'string') {
        query = query.lt('created_at', req.query.before);
      }

      const { data: messages, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch messages: ${error.message}`);
      }

      res.json({ data: messages });
    } catch (err) {
      next(err);
    }
  },
);

// POST /chat/sessions/:id/messages (SSE stream)
chatRouter.post(
  '/chat/sessions/:id/messages',
  requireAuth,
  aiHourlyLimiter,
  checkAiDailyQuota,
  validate({ params: IdParamSchema, body: ChatMessageSchema }),
  async (req, res, next) => {
    try {
      await ChatService.sendMessageAndStream(
        req.supabase!,
        req.user!.id,
        req.requestId || 'req-' + Date.now(),
        req.params.id as string,
        req.body,
        req,
        res,
      );
    } catch (err) {
      if (!res.headersSent) {
        next(err);
      }
    }
  },
);

// PATCH /chat/sessions/:id
chatRouter.patch(
  '/chat/sessions/:id',
  requireAuth,
  validate({ params: IdParamSchema, body: ChatSessionUpdateSchema }),
  async (req, res, next) => {
    try {
      const { data: session, error } = await req.supabase!
        .from('chat_sessions')
        .update({ title: req.body.title })
        .eq('id', req.params.id)
        .select('*')
        .maybeSingle();

      if (error || !session) {
        throw new NotFoundError('Chat session not found.');
      }

      res.json({ data: session });
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /chat/sessions/:id
chatRouter.delete(
  '/chat/sessions/:id',
  requireAuth,
  validate({ params: IdParamSchema }),
  async (req, res, next) => {
    try {
      const { error } = await req.supabase!
        .from('chat_sessions')
        .delete()
        .eq('id', req.params.id);

      if (error) {
        throw new Error(`Failed to delete chat session: ${error.message}`);
      }

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);
