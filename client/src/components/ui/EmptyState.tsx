import React from 'react';

export interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  action,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 border-2 border-dashed border-stone-200 rounded-2xl bg-white/50">
      <div className="w-16 h-16 rounded-2xl bg-leaf-50 text-leaf-600 flex items-center justify-center mb-4">
        {icon || (
          <svg
            className="w-8 h-8 text-leaf-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.75"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        )}
      </div>
      <h3 className="text-lg font-bold text-stone-900 font-display mb-1">{title}</h3>
      <p className="text-sm text-stone-600 max-w-sm mb-6">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};
