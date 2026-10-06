import React from 'react';
import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface QuickPromptChipsProps {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

export const QuickPromptChips: React.FC<QuickPromptChipsProps> = ({ onSelect, disabled }) => {
  const { t } = useTranslation();

  const defaultPrompts = [
    'Best time to irrigate this week given the forecast?',
    'How to control aphids and sucking pests organically?',
    'What government schemes or subsidies apply to drip irrigation?',
    'Symptoms of nitrogen versus zinc deficiency in my crop?',
  ];

  const prompts: string[] = (t('assistant.quickPrompts', { returnObjects: true }) as string[]) || defaultPrompts;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-bold text-stone-500 uppercase tracking-wider">
        <Sparkles className="w-3.5 h-3.5 text-sun-500" />
        <span>Quick Questions</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {prompts.map((p, idx) => (
          <button
            key={idx}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(p)}
            className="text-xs font-semibold px-3 py-2 rounded-xl border border-stone-200 bg-white hover:bg-leaf-50 hover:border-leaf-300 text-stone-700 hover:text-leaf-900 transition-colors text-left shadow-subtle min-h-[44px]"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
};
