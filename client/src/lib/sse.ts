import { supabase } from './supabaseClient';

export interface SSECallbacks {
  onToken: (token: string) => void;
  onDone?: (data: { messageId?: string }) => void;
  onError?: (error: Error) => void;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

export async function postSSEStream(
  path: string,
  body: unknown,
  callbacks: SSECallbacks,
  signal?: AbortSignal
): Promise<void> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    let errMsg = `Streaming error: ${response.statusText}`;
    try {
      const errJson = await response.json();
      errMsg = errJson.error?.message || errMsg;
    } catch {
      // Non-json error
    }
    const err = new Error(errMsg);
    callbacks.onError?.(err);
    throw err;
  }

  if (!response.body) {
    const err = new Error('No response body returned from stream endpoint');
    callbacks.onError?.(err);
    throw err;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const block of lines) {
        if (!block.trim()) continue;

        let eventType = 'message';
        let dataString = '';

        const eventLines = block.split('\n');
        for (const line of eventLines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            dataString = line.slice(6).trim();
          }
        }

        if (eventType === 'token') {
          try {
            const parsed = JSON.parse(dataString);
            if (parsed.t) callbacks.onToken(parsed.t);
          } catch {
            callbacks.onToken(dataString);
          }
        } else if (eventType === 'done') {
          try {
            const parsed = JSON.parse(dataString);
            callbacks.onDone?.(parsed);
          } catch {
            callbacks.onDone?.({});
          }
        } else if (eventType === 'error') {
          try {
            const parsed = JSON.parse(dataString);
            const err = new Error(parsed.error || 'Stream error');
            callbacks.onError?.(err);
          } catch {
            callbacks.onError?.(new Error(dataString));
          }
        }
      }
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return;
    }
    callbacks.onError?.(error);
    throw error;
  } finally {
    reader.releaseLock();
  }
}
