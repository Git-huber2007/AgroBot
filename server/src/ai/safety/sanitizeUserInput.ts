/**
 * Strips control characters, null bytes, and delimiter tokens,
 * then safely wraps in <<<USER_INPUT>>> delimiters to defend against prompt injection.
 */
export function sanitizeUserInput(input?: string | null): string {
  if (!input) return '';
  const cleaned = input
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/<<<|>>>/g, '')
    .trim();
  return cleaned;
}

export function formatDelimitedInput(input?: string | null, fallback = 'None provided'): string {
  const cleaned = sanitizeUserInput(input);
  const text = cleaned || fallback;
  return `<<<USER_INPUT>>>\n${text}\n<<<END_USER_INPUT>>>`;
}
