import React from 'react';

export interface FormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  error,
  hint,
  required = false,
  children,
  className = '',
}) => {
  const errorId = htmlFor ? `${htmlFor}-error` : undefined;
  const hintId = htmlFor ? `${htmlFor}-hint` : undefined;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label
        htmlFor={htmlFor}
        className="text-sm font-semibold text-stone-800 flex items-center justify-between"
      >
        <span>
          {label}
          {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
        </span>
      </label>

      {children}

      {error ? (
        <p id={errorId} className="text-sm text-red-600 font-medium animate-fadeIn">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-xs text-stone-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
};
