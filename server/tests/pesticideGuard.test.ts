import { describe, it, expect } from 'vitest';
import { checkPesticideSafety, sanitizeChemicalTreatments } from '../src/ai/safety/pesticideGuard.js';

describe('Pesticide Safety Guard (CIB&RC Regulatory Compliance)', () => {
  it('detects banned pesticide endosulfan', () => {
    const result = checkPesticideSafety({
      active_ingredient: 'Endosulfan 35% EC',
      formulation: 'EC',
      dose_per_litre: '2 ml',
      dose_per_acre: '400 ml',
      application_method: 'Foliar spray',
      pre_harvest_interval_days: 14,
      safety_precautions: ['Wear gloves', 'Use mask'],
    });

    expect(result.hasBanned).toBe(true);
    expect(result.violations[0]).toContain('Banned or restricted pesticide detected');
  });

  it('detects proprietary trademark symbols (® or ™)', () => {
    const result = checkPesticideSafety({
      active_ingredient: 'Roundup® Glyphosate',
      formulation: 'SL',
      dose_per_litre: '5 ml',
      dose_per_acre: '1000 ml',
      application_method: 'Directed spray',
      pre_harvest_interval_days: null,
      safety_precautions: ['Wear gloves', 'Protective eyewear'],
    });

    expect(result.hasBrandName).toBe(true);
    expect(result.violations[0]).toContain('Proprietary brand name mark detected');
  });

  it('permits safe approved active ingredient (e.g. Chlorantraniliprole)', () => {
    const result = checkPesticideSafety({
      active_ingredient: 'Chlorantraniliprole 18.5% SC',
      formulation: 'SC',
      dose_per_litre: '0.4 ml',
      dose_per_acre: '60 ml',
      application_method: 'Foliar spray',
      pre_harvest_interval_days: 14,
      safety_precautions: ['Wear gloves', 'Wear protective face mask'],
    });

    expect(result.hasBanned).toBe(false);
    expect(result.hasBrandName).toBe(false);
    expect(result.violations.length).toBe(0);
  });

  it('sanitizes list by stripping banned chemicals and adding warnings', () => {
    const treatments = [
      {
        active_ingredient: 'Monocrotophos 36% SL',
        formulation: 'SL',
        dose_per_litre: '1.5 ml',
        dose_per_acre: '300 ml',
        application_method: 'Foliar',
        pre_harvest_interval_days: 21,
        safety_precautions: ['Gloves', 'Boots'],
      },
      {
        active_ingredient: 'Imidacloprid 17.8% SL',
        formulation: 'SL',
        dose_per_litre: '0.5 ml',
        dose_per_acre: '100 ml',
        application_method: 'Foliar',
        pre_harvest_interval_days: 15,
        safety_precautions: ['Gloves', 'Mask'],
      },
    ];

    const sanitized = sanitizeChemicalTreatments(treatments);
    expect(sanitized.cleanList.length).toBe(1);
    expect(sanitized.cleanList[0]?.active_ingredient).toBe('Imidacloprid 17.8% SL');
    expect(sanitized.removedWarnings.length).toBe(1);
    expect(sanitized.removedWarnings[0]).toContain('removed because it is banned or restricted in India');
  });
});
