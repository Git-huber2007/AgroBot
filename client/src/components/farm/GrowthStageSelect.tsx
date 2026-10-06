import React, { useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import type { Crop } from './CropSelect';

export interface GrowthStageSelectProps {
  crop?: Crop | null;
  sowingDate?: string;
  value: string;
  onChange: (stageKey: string) => void;
  hasError?: boolean;
}

export const GrowthStageSelect: React.FC<GrowthStageSelectProps> = ({
  crop,
  sowingDate,
  value,
  onChange,
  hasError,
}) => {
  const stages = crop?.growth_stages || [];

  // Calculate auto-suggested stage
  let autoSuggestedKey: string | null = null;
  let daysAfterSowing: number | null = null;

  if (sowingDate && stages.length > 0) {
    const sDate = new Date(sowingDate);
    const today = new Date();
    const diffTime = today.getTime() - sDate.getTime();
    daysAfterSowing = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

    const matched = stages.find(
      (st) => daysAfterSowing! >= st.day_start && daysAfterSowing! <= st.day_end
    );

    if (matched) {
      autoSuggestedKey = matched.key;
    } else if (daysAfterSowing > (stages[stages.length - 1]?.day_end || 999)) {
      autoSuggestedKey = stages[stages.length - 1]?.key || null;
    } else {
      autoSuggestedKey = stages[0]?.key || null;
    }
  }

  // When auto-suggest changes and user hasn't selected anything yet, default to auto-suggest
  useEffect(() => {
    if (autoSuggestedKey && (!value || !stages.some((s) => s.key === value))) {
      onChange(autoSuggestedKey);
    }
  }, [autoSuggestedKey, value, stages, onChange]);

  if (!crop) {
    return (
      <div className="p-3 bg-stone-50 rounded-lg text-sm text-stone-500 border border-stone-200">
        Please select a crop first to load growth stages.
      </div>
    );
  }

  const suggestedStageObj = stages.find((s) => s.key === autoSuggestedKey);

  return (
    <div className="space-y-2">
      {autoSuggestedKey && suggestedStageObj && (
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-leaf-50 border border-leaf-200 text-xs font-medium text-leaf-900">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-leaf-600" />
            <span>
              Auto-suggested stage ({daysAfterSowing} days after sowing):{' '}
              <strong>{suggestedStageObj.label_en}</strong>
            </span>
          </div>
          {value !== autoSuggestedKey && (
            <button
              type="button"
              onClick={() => onChange(autoSuggestedKey!)}
              className="text-leaf-700 underline font-semibold hover:text-leaf-800"
            >
              Use suggested
            </button>
          )}
        </div>
      )}

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-lg border px-3.5 py-2.5 text-base text-stone-900 focus:outline-none focus:ring-2 focus:ring-offset-1 min-h-[44px] transition-colors ${
          hasError
            ? 'border-red-400 focus:border-red-500 focus:ring-red-200 bg-red-50/20'
            : 'border-stone-300 focus:border-leaf-600 focus:ring-leaf-200 bg-white'
        }`}
      >
        <option value="">-- Select Growth Stage --</option>
        {stages.map((st) => (
          <option key={st.key} value={st.key}>
            {st.label_en} (Days {st.day_start}–{st.day_end})
            {st.key === autoSuggestedKey ? ' ★ (Recommended)' : ''}
          </option>
        ))}
      </select>
    </div>
  );
};
