import React from 'react';
import { Sparkles } from 'lucide-react';
import { useQuota } from '../../hooks/useQuota';

export const QuotaBadge: React.FC = () => {
  const { remaining, limit } = useQuota();

  const isLow = remaining <= 10;

  return (
    <div
      title={`Daily AI Quota: ${remaining} of ${limit} remaining today`}
      className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
        isLow
          ? 'bg-sun-50 text-sun-900 border-sun-300'
          : 'bg-leaf-50 text-leaf-900 border-leaf-200'
      }`}
    >
      <Sparkles className={`w-3.5 h-3.5 ${isLow ? 'text-sun-600' : 'text-leaf-600'}`} />
      <span>
        {remaining}/{limit} AI calls left
      </span>
    </div>
  );
};
