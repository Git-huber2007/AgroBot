import React from 'react';
import { Printer } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const PrintButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 transition-colors min-h-[44px] no-print ${className}`}
      aria-label={t('common.print', 'Print Report')}
    >
      <Printer className="w-4 h-4 text-stone-600" />
      <span>{t('common.print', 'Print')}</span>
    </button>
  );
};
