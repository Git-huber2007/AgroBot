import React, { forwardRef } from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', hasError, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`w-full rounded-lg border px-3.5 py-2.5 text-base text-stone-900 focus:outline-none focus:ring-2 focus:ring-offset-1 min-h-[44px] transition-colors ${
          hasError
            ? 'border-red-400 focus:border-red-500 focus:ring-red-200 bg-red-50/20'
            : 'border-stone-300 focus:border-leaf-600 focus:ring-leaf-200 bg-white'
        } ${className}`}
        {...props}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = 'Select';
