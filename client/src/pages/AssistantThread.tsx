import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Sprout } from 'lucide-react';
import { api } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import { postSSEStream } from '../lib/sse';
import { useActiveFarm } from '../hooks/useActiveFarm';
import { useToast } from '../components/ui/Toast';
import { ChatMessageBubble } from '../components/assistant/ChatMessageBubble';
import { ChatComposer } from '../components/assistant/ChatComposer';
import { QuickPromptChips } from '../components/assistant/QuickPromptChips';
import { AIDisclaimer } from '../components/ui/AIDisclaimer';
import { Skeleton } from '../components/ui/Skeleton';

export interface ChatMessage {
  id: number;
  session_id: string;
  role: 'user' | 'model';
  content: string;
  created_at: string;
}

export const AssistantThread: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { activeFarm } = useActiveFarm();
  const { error } = useToast();

  const [inputMessage, setInputMessage] = useState('');
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useQuery<ChatMessage[]>({
    queryKey: queryKeys.chatMessages(sessionId || ''),
    queryFn: () => api.get<ChatMessage[]>(`/chat/sessions/${sessionId}/messages`),
    enabled: !!sessionId,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isStreaming || !sessionId) return;

    setInputMessage('');
    setIsStreaming(true);
    setStreamingContent('');

    // Optimistically append user message to TanStack Query cache
    const optimisticUserMsg: ChatMessage = {
      id: Date.now(),
      session_id: sessionId,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };

    queryClient.setQueryData<ChatMessage[]>(
      queryKeys.chatMessages(sessionId),
      (prev = []) => [...prev, optimisticUserMsg]
    );

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    let accumulatedTokens = '';

    try {
      await postSSEStream(
        `/chat/sessions/${sessionId}/messages`,
        { content: text },
        {
          onToken: (token) => {
            accumulatedTokens += token;
            setStreamingContent(accumulatedTokens);
          },
          onDone: () => {
            setIsStreaming(false);
            setStreamingContent('');
            queryClient.invalidateQueries({ queryKey: queryKeys.chatMessages(sessionId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.chatSessions });
          },
          onError: (err) => {
            setIsStreaming(false);
            setStreamingContent('');
            error(err.message || 'Stream disconnected. Please try again.');
          },
        },
        abortController.signal
      );
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        error(err.message || 'Failed to send message');
      }
      setIsStreaming(false);
      setStreamingContent('');
    }
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      setStreamingContent('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/assistant')}
            className="p-2 rounded-lg text-stone-600 hover:bg-stone-100 transition-colors"
            aria-label="Back to conversations"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900 font-display">
              CropSage Farm Advisor
            </h2>
            <p className="text-xs text-stone-500">
              {activeFarm ? (
                <span className="flex items-center gap-1 text-leaf-700 font-medium">
                  <Sprout className="w-3.5 h-3.5" />
                  Farm: {activeFarm.name} ({activeFarm.district})
                </span>
              ) : (
                'No farm selected'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-3/4" />
            <Skeleton className="h-20 w-2/3 ml-auto" />
            <Skeleton className="h-16 w-3/4" />
          </div>
        ) : messages.length === 0 ? (
          <div className="py-8 space-y-6 text-center max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-leaf-100 text-leaf-700 flex items-center justify-center mx-auto">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900 font-display">
                How can I assist your farm today?
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 mt-1">
                Ask about crop disease management, irrigation timing, fertilizer doses, or regional
                weather impacts.
              </p>
            </div>

            <QuickPromptChips onSelect={(prompt) => handleSendMessage(prompt)} disabled={isStreaming} />
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <ChatMessageBubble key={msg.id} role={msg.role} content={msg.content} />
            ))}

            {isStreaming && streamingContent && (
              <ChatMessageBubble role="model" content={streamingContent} isStreaming={true} />
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer & Disclaimer */}
      <div className="pt-2 space-y-2 border-t border-stone-200/80 bg-soil-50">
        <ChatComposer
          value={inputMessage}
          onChange={setInputMessage}
          onSend={() => handleSendMessage()}
          onStop={handleStopStreaming}
          isStreaming={isStreaming}
          disabled={isLoading}
        />

        <p className="text-[11px] text-stone-400 text-center">
          CropSage AI gives guidance based on agronomic models. Always verify chemical rates with your local KVK officer.
        </p>
      </div>
    </div>
  );
};
