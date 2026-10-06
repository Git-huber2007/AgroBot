import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.js';

// Server-only. This module must NEVER be imported by the client workspace (§13.2).
export const genai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
