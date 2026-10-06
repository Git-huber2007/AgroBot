import { describe, it, expect } from 'vitest';
import { calculateFertilizerRequirements } from '../src/services/fertilizerCalculator.js';

describe('Fertilizer Calculator Service (Deterministic SHC)', () => {
  const basePaddyNpk = { N: 120, P2O5: 60, K2O: 40 };

  // Test Case 1: Standard Medium soil with Urea, DAP, MOP
  it('1. correctly computes quantities for medium soil test ratings', () => {
    const result = calculateFertilizerRequirements({
      baseNpk: basePaddyNpk,
      areaHectares: 1.0,
      selectedFertilizers: ['urea', 'dap', 'mop'],
      soilTest: { soilN: 350, soilP: 18, soilK: 180 }, // all medium
    });

    expect(result.soilRatings.nRating).toBe('medium');
    expect(result.soilRatings.pRating).toBe('medium');
    expect(result.soilRatings.kRating).toBe('medium');

    // DAP supplies 60 kg P2O5 -> 60 / 0.46 = 130.4 kg DAP
    const dap = result.products.find(p => p.fertilizerKey === 'dap');
    expect(dap).toBeDefined();
    expect(dap?.kg_per_ha).toBeCloseTo(130.4, 0);

    // DAP also supplied 130.4 * 0.18 = 23.5 kg N.
    // Remaining N = 120 - 23.5 = 96.5 kg -> Urea = 96.5 / 0.46 = 209.8 kg Urea
    const urea = result.products.find(p => p.fertilizerKey === 'urea');
    expect(urea).toBeDefined();
    expect(urea?.kg_per_ha).toBeCloseTo(209.8, 0);

    // MOP supplies 40 kg K2O -> 40 / 0.60 = 66.7 kg MOP
    const mop = result.products.find(p => p.fertilizerKey === 'mop');
    expect(mop).toBeDefined();
    expect(mop?.kg_per_ha).toBeCloseTo(66.7, 0);
  });

  // Test Case 2: Low nutrient ratings (+25% multiplier)
  it('2. increases nutrients by 25% for low soil test values', () => {
    const result = calculateFertilizerRequirements({
      baseNpk: basePaddyNpk,
      areaHectares: 1.0,
      selectedFertilizers: ['urea', 'dap', 'mop'],
      soilTest: { soilN: 200, soilP: 8, soilK: 80 }, // all low (<280, <10, <110)
    });

    expect(result.soilRatings.nRating).toBe('low');
    expect(result.soilRatings.pRating).toBe('low');
    expect(result.soilRatings.kRating).toBe('low');
    expect(result.adjustedNpkPerHa.N).toBe(150); // 120 * 1.25
    expect(result.adjustedNpkPerHa.P2O5).toBe(75); // 60 * 1.25
    expect(result.adjustedNpkPerHa.K2O).toBe(50); // 40 * 1.25
  });

  // Test Case 3: High nutrient ratings (-25% multiplier)
  it('3. decreases nutrients by 25% for high soil test values', () => {
    const result = calculateFertilizerRequirements({
      baseNpk: basePaddyNpk,
      areaHectares: 1.0,
      selectedFertilizers: ['urea', 'dap', 'mop'],
      soilTest: { soilN: 600, soilP: 35, soilK: 350 }, // all high (>560, >25, >280)
    });

    expect(result.soilRatings.nRating).toBe('high');
    expect(result.soilRatings.pRating).toBe('high');
    expect(result.soilRatings.kRating).toBe('high');
    expect(result.adjustedNpkPerHa.N).toBe(90); // 120 * 0.75
    expect(result.adjustedNpkPerHa.P2O5).toBe(45); // 60 * 0.75
    expect(result.adjustedNpkPerHa.K2O).toBe(30); // 40 * 0.75
  });

  // Test Case 4: Missing soil test values assumed Medium (x1.0)
  it('4. assumes medium rating when soil test values are omitted', () => {
    const result = calculateFertilizerRequirements({
      baseNpk: basePaddyNpk,
      areaHectares: 1.0,
      selectedFertilizers: ['urea', 'dap', 'mop'],
      soilTest: {},
    });

    expect(result.soilRatings.nRating).toBe('medium');
    expect(result.soilRatings.pRating).toBe('medium');
    expect(result.soilRatings.kRating).toBe('medium');
    expect(result.soilRatings.assumptions.length).toBe(3);
    expect(result.adjustedNpkPerHa.N).toBe(120);
  });

  // Test Case 5: Complex fertilizer NPK 10:26:26 allocation
  it('5. correctly uses complex fertilizer NPK 10:26:26', () => {
    const result = calculateFertilizerRequirements({
      baseNpk: { N: 100, P2O5: 50, K2O: 50 },
      areaHectares: 1.0,
      selectedFertilizers: ['npk_10_26_26', 'urea'],
      soilTest: { soilN: 400, soilP: 15, soilK: 200 },
    });

    const complex = result.products.find(p => p.fertilizerKey === 'npk_10_26_26');
    expect(complex).toBeDefined();
    // 50 kg P2O5 / 0.26 = 192.3 kg complex
    expect(complex?.kg_per_ha).toBeCloseTo(192.3, 0);

    const urea = result.products.find(p => p.fertilizerKey === 'urea');
    expect(urea).toBeDefined();
  });

  // Test Case 6: Single Super Phosphate (SSP) as P source
  it('6. correctly uses SSP when selected without DAP', () => {
    const result = calculateFertilizerRequirements({
      baseNpk: { N: 80, P2O5: 40, K2O: 40 },
      areaHectares: 2.0,
      selectedFertilizers: ['ssp', 'urea', 'mop'],
    });

    const ssp = result.products.find(p => p.fertilizerKey === 'ssp');
    expect(ssp).toBeDefined();
    // 40 kg P2O5 / 0.16 = 250 kg/ha -> 500 kg total for 2 ha
    expect(ssp?.kg_per_ha).toBe(250);
    expect(ssp?.kg_total).toBe(500);
    expect(ssp?.bags_50kg).toBe(10);
  });

  // Test Case 7: Target yield scaling within [0.7, 1.3] clamp
  it('7. scales nutrient requirement according to target yield with clamping', () => {
    // Higher target yield (6 t/ha vs typical 4 t/ha -> 1.5 ratio clamped to 1.3)
    const resultHigh = calculateFertilizerRequirements({
      baseNpk: { N: 100, P2O5: 50, K2O: 50 },
      areaHectares: 1.0,
      selectedFertilizers: ['urea', 'dap', 'mop'],
      targetYieldTHa: 6.0,
      typicalYieldTHa: 4.0,
    });
    expect(resultHigh.adjustedNpkPerHa.N).toBe(130); // 100 * 1.3

    // Lower target yield (2 t/ha vs typical 4 t/ha -> 0.5 ratio clamped to 0.7)
    const resultLow = calculateFertilizerRequirements({
      baseNpk: { N: 100, P2O5: 50, K2O: 50 },
      areaHectares: 1.0,
      selectedFertilizers: ['urea', 'dap', 'mop'],
      targetYieldTHa: 2.0,
      typicalYieldTHa: 4.0,
    });
    expect(resultLow.adjustedNpkPerHa.N).toBe(70); // 100 * 0.7
  });

  // Test Case 8: Organic inputs (FYM and Vermicompost)
  it('8. reports organic inputs with standard recommended agronomic dosages', () => {
    const result = calculateFertilizerRequirements({
      baseNpk: basePaddyNpk,
      areaHectares: 2.5,
      selectedFertilizers: ['fym', 'vermicompost'],
    });

    expect(result.organicNotes.length).toBe(2);
    expect(result.organicNotes[0]).toContain('5 tonnes/ha (12.5 tonnes total) of well-decomposed Farm Yard Manure');
    expect(result.organicNotes[1]).toContain('2 tonnes/ha (5 tonnes total) of Vermicompost');
  });
});
