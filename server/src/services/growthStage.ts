import { daysBetween } from '../utils/dates.js';

export interface GrowthStageItem {
  key: string;
  label_en: string;
  day_start: number;
  day_end: number;
}

export interface SuggestedGrowthStage {
  stage: GrowthStageItem;
  daysAfterSowing: number;
  isBeyondDuration: boolean;
}

/**
 * Auto-suggests the appropriate growth stage based on sowing date and crop duration.
 */
export function autoSuggestGrowthStage(
  sowingDate: string | Date,
  stages: GrowthStageItem[],
  referenceDate: string | Date = new Date(),
): SuggestedGrowthStage {
  if (!stages || stages.length === 0) {
    const fallback: GrowthStageItem = {
      key: 'vegetative',
      label_en: 'Active Vegetative',
      day_start: 0,
      day_end: 100,
    };
    return {
      stage: fallback,
      daysAfterSowing: Math.max(0, daysBetween(sowingDate, referenceDate)),
      isBeyondDuration: false,
    };
  }

  const das = Math.max(0, daysBetween(sowingDate, referenceDate));

  // Find stage where das falls into [day_start, day_end]
  const matched = stages.find(s => das >= s.day_start && das <= s.day_end);
  if (matched) {
    return {
      stage: matched,
      daysAfterSowing: das,
      isBeyondDuration: false,
    };
  }

  // If before first stage
  const firstStage = stages[0]!;
  if (das < firstStage.day_start) {
    return {
      stage: firstStage,
      daysAfterSowing: das,
      isBeyondDuration: false,
    };
  }

  // If beyond last stage, pick last stage (Maturity / Harvest)
  const lastStage = stages[stages.length - 1]!;
  return {
    stage: lastStage,
    daysAfterSowing: das,
    isBeyondDuration: true,
  };
}
