import { LANGUAGE_LOOKUP, type AppLanguage, type Farm } from '@cropsage/shared';
import { SYSTEM_PROMPT_V1 } from './system.js';
import { formatFarmContextBlock } from './contextBlocks.js';

export interface ChatPromptContext {
  farm?: Farm | null;
  latest_advisory_summary?: string | null;
  context_summary?: string | null;
  language: AppLanguage;
}

export function buildChatSystemInstruction(ctx: ChatPromptContext): string {
  const langMeta = LANGUAGE_LOOKUP[ctx.language] ?? LANGUAGE_LOOKUP.en;
  const farmBlock = ctx.farm ? formatFarmContextBlock(ctx.farm) : 'No farm selected.';

  const chatAddendum = `\n\nMODE: Conversational chat. Reply in ${langMeta.name} using short paragraphs and bullet points (Markdown allowed: bold, lists; no tables, no images, no links except official .gov.in/.nic.in portals). Keep replies under 250 words unless the farmer asks for detail. Ask ONE clarifying question if essential information (crop, stage, symptom) is missing.

ACTIVE FARM CONTEXT:
${farmBlock}
LATEST ADVISORY SUMMARY: ${ctx.latest_advisory_summary ?? 'none'}
EARLIER CONVERSATION SUMMARY: ${ctx.context_summary ?? 'none'}`;

  return SYSTEM_PROMPT_V1 + chatAddendum;
}
