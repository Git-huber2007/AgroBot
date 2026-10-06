import React, { useRef, useEffect } from 'react';
import { Send, Square } from 'lucide-react';

export interface ChatComposerProps {
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
  onStop?: () => void;
  isStreaming?: boolean;
  disabled?: boolean;
}

export const ChatComposer: React.FC<ChatComposerProps> = ({
  value,
  onChange,
  onSend,
  onStop,
  isStreaming = false,
  disabled = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && value.trim() && !disabled) {
        onSend();
      }
    }
  };

  return (
    <div className="relative flex items-end gap-2 p-2 rounded-2xl border border-stone-200 bg-white shadow-card focus-within:border-leaf-600 focus-within:ring-2 focus-within:ring-leaf-100 transition-all">
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything about crop management, soil, weather, or government schemes..."
        disabled={disabled || (isStreaming && !onStop)}
        maxLength={2000}
        className="flex-1 max-h-40 min-h-[44px] py-2.5 px-3 bg-transparent border-0 resize-none text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none"
      />

      <div className="flex items-center gap-1.5 pb-1 pr-1 shrink-0">
        <span className="text-[10px] text-stone-400 hidden sm:inline">
          {value.length}/2000
        </span>

        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            className="p-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center shadow-sm"
            aria-label="Stop generating response"
          >
            <Square className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onSend}
            disabled={!value.trim() || disabled}
            className="p-2.5 rounded-xl bg-leaf-600 hover:bg-leaf-700 active:bg-leaf-800 disabled:opacity-40 disabled:pointer-events-none text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center shadow-sm"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
