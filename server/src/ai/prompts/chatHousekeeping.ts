import { LANGUAGE_LOOKUP, type AppLanguage } from '@cropsage/shared';

export function buildChatTitlingPrompt(firstUserMsg: string, firstAssistantMsg: string, language: AppLanguage): string {
  const langMeta = LANGUAGE_LOOKUP[language] ?? LANGUAGE_LOOKUP.en;
  return `Generate a concise title (maximum 6 words) in ${langMeta.name} for the following conversation exchange.

Farmer: "${firstUserMsg.substring(0, 300)}"
Assistant: "${firstAssistantMsg.substring(0, 300)}"

Return JSON matching schema {"title": string}.`;
}

export function buildChatSummaryPrompt(existingSummary: string | null, recentMessages: Array<{ role: string; content: string }>): string {
  const conversationText = recentMessages
    .map(m => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n');

  return `TASK: Update the running conversation summary.
Keep it strictly under 120 words. Focus only on key facts about the farmer's crops, symptoms/problems discussed, soil status, and specific recommendations given so far.

PREVIOUS SUMMARY:
${existingSummary ?? 'None'}

RECENT MESSAGES:
${conversationText}

Return JSON matching schema {"summary": string}.`;
}
