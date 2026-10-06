import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { Copy, Check, Bot, User } from 'lucide-react';

export interface ChatMessageProps {
  role: 'user' | 'model';
  content: string;
  isStreaming?: boolean;
}

export const ChatMessageBubble: React.FC<ChatMessageProps> = ({
  role,
  content,
  isStreaming = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUser = role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start group`}>
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
          isUser
            ? 'bg-stone-800 text-white'
            : 'bg-leaf-600 text-white shadow-sm'
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      <div
        className={`relative max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-stone-900 text-white rounded-tr-xs'
            : 'bg-white border border-stone-200/90 text-stone-900 shadow-subtle rounded-tl-xs'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{content}</p>
        ) : (
          <div className="prose prose-sm max-w-none prose-stone prose-p:leading-relaxed prose-headings:font-display prose-headings:font-bold prose-headings:text-stone-900 prose-li:my-0.5">
            <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{content}</ReactMarkdown>
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 ml-1 bg-leaf-600 animate-pulse align-middle" />
            )}
          </div>
        )}

        {!isUser && !isStreaming && content && (
          <div className="flex justify-end pt-2 mt-1 border-t border-stone-100 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[11px] text-stone-400 hover:text-stone-700 transition-colors p-1"
              aria-label="Copy message"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-leaf-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
