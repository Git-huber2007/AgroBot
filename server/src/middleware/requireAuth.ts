import type { NextFunction, Request, Response } from 'express';
import { supabaseAdmin } from '../db/adminClient.js';
import { createUserClient } from '../db/userClient.js';
import { UnauthorizedError } from '../utils/errors.js';

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or malformed Authorization header');
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      throw new UnauthorizedError('Authorization token is missing');
    }

    // Verify token cryptographically and fetch user record with Supabase Auth
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) {
      throw new UnauthorizedError('Invalid or expired authentication session');
    }

    // Attach authenticated identity and user-scoped RLS client
    req.user = {
      id: data.user.id,
      email: data.user.email,
    };
    req.supabase = createUserClient(token);

    next();
  } catch (err) {
    next(err);
  }
}
