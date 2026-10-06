import React, { forwardRef } from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', hasError, rows = 3, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={`w-full rounded-lg border px-3.5 py-2.5 text-base text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-offset-1 transition-colors ${
          hasError
            ? 'border-red-400 focus:border-red-500 focus:ring-red-200 bg-red-50/20'
            : 'border-stone-300 focus:border-leaf-600 focus:ring-leaf-200 bg-white'
        } ${className}`}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
