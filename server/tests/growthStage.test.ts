import { describe, it, expect } from 'vitest';
import { autoSuggestGrowthStage, type GrowthStageItem } from '../src/services/growthStage.js';

describe('Growth Stage Auto-Suggestion', () => {
  const wheatStages: GrowthStageItem[] = [
    { key: 'cri', label_en: 'Crown Root Initiation (CRI)', day_start: 0, day_end: 25 },
    { key: 'tillering', label_en: 'Tillering', day_start: 26, day_end: 45 },
    { key: 'jointing', label_en: 'Jointing', day_start: 46, day_end: 65 },
    { key: 'booting', label_en: 'Booting & Heading', day_start: 66, day_end: 85 },
    { key: 'milking', label_en: 'Milk & Dough Grain Filling', day_start: 86, day_end: 115 },
    { key: 'maturity', label_en: 'Maturity & Ripening', day_start: 116, day_end: 140 },
  ];

  it('suggests CRI for 15 days after sowing', () => {
    const today = new Date('2026-03-15');
    const sowing = new Date('2026-03-01'); // 14 days
    const result = autoSuggestGrowthStage(sowing, wheatStages, today);
    expect(result.stage.key).toBe('cri');
    expect(result.daysAfterSowing).toBe(14);
    expect(result.isBeyondDuration).toBe(false);
  });

  it('suggests Tillering for 35 days after sowing', () => {
    const today = new Date('2026-04-05');
    const sowing = new Date('2026-03-01'); // 35 days
    const result = autoSuggestGrowthStage(sowing, wheatStages, today);
    expect(result.stage.key).toBe('tillering');
    expect(result.daysAfterSowing).toBe(35);
  });

  it('suggests Maturity when beyond typical duration (160 days)', () => {
    const today = new Date('2026-08-08');
    const sowing = new Date('2026-03-01'); // 160 days
    const result = autoSuggestGrowthStage(sowing, wheatStages, today);
    expect(result.stage.key).toBe('maturity');
    expect(result.isBeyondDuration).toBe(true);
  });

  it('handles empty growth stage gracefully', () => {
    const result = autoSuggestGrowthStage('2026-03-01', [], new Date('2026-03-10'));
    expect(result.stage.key).toBe('vegetative');
  });
});
