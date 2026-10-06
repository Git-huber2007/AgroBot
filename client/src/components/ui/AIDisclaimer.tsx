import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const AIDisclaimer: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { t } = useTranslation();

  return (
    <aside
      aria-label="AI Advisory Disclaimer"
      className={`flex items-start gap-3 p-4 rounded-xl bg-sun-50 border border-sun-200 text-sun-900 text-xs sm:text-sm font-medium ${className}`}
    >
      <AlertTriangle className="w-5 h-5 text-sun-600 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="font-semibold text-sun-950">
          {t('disclaimer', 'AI-generated guidance. Verify with your local KVK or agriculture officer before applying chemicals.')}
        </p>
        <p className="text-xs text-sun-800/90 mt-1">
          Kisan Call Centre toll-free: <span className="font-bold">1800-180-1551</span>. Always adhere to local packaging labels and economic threshold levels.
        </p>
      </div>
    </aside>
  );
};
