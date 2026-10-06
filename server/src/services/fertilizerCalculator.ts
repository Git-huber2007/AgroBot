import { AVAILABLE_FERTILIZERS, type FertilizerKey } from '@cropsage/shared';
import { hectaresToAcres } from '../utils/units.js';

export interface SoilTestInput {
  soilN?: number | null; // kg/ha
  soilP?: number | null; // kg/ha
  soilK?: number | null; // kg/ha
}

export interface NpkRecommendation {
  N: number;
  P2O5: number;
  K2O: number;
}

export interface FertilizerCalculationParams {
  baseNpk: NpkRecommendation;
  areaHectares: number;
  selectedFertilizers: FertilizerKey[];
  soilTest?: SoilTestInput;
  targetYieldTHa?: number | null;
  typicalYieldTHa?: number;
}

export type SoilRating = 'low' | 'medium' | 'high';

export interface CalculatedProductAllocation {
  fertilizerKey: FertilizerKey;
  name: string;
  kg_per_ha: number;
  kg_total: number;
  kg_per_acre: number;
  bags_50kg: number;
}

export interface FertilizerCalculationResult {
  adjustedNpkPerHa: {
    N: number;
    P2O5: number;
    K2O: number;
  };
  soilRatings: {
    nRating: SoilRating;
    pRating: SoilRating;
    kRating: SoilRating;
    assumptions: string[];
  };
  products: CalculatedProductAllocation[];
  organicNotes: string[];
}

export function getSoilRatingN(n?: number | null): { rating: SoilRating; factor: number; assumed: boolean } {
  if (n === undefined || n === null || Number.isNaN(n)) {
    return { rating: 'medium', factor: 1.0, assumed: true };
  }
  if (n < 280) return { rating: 'low', factor: 1.25, assumed: false };
  if (n > 560) return { rating: 'high', factor: 0.75, assumed: false };
  return { rating: 'medium', factor: 1.0, assumed: false };
}

export function getSoilRatingP(p?: number | null): { rating: SoilRating; factor: number; assumed: boolean } {
  if (p === undefined || p === null || Number.isNaN(p)) {
    return { rating: 'medium', factor: 1.0, assumed: true };
  }
  if (p < 10) return { rating: 'low', factor: 1.25, assumed: false };
  if (p > 25) return { rating: 'high', factor: 0.75, assumed: false };
  return { rating: 'medium', factor: 1.0, assumed: false };
}

export function getSoilRatingK(k?: number | null): { rating: SoilRating; factor: number; assumed: boolean } {
  if (k === undefined || k === null || Number.isNaN(k)) {
    return { rating: 'medium', factor: 1.0, assumed: true };
  }
  if (k < 110) return { rating: 'low', factor: 1.25, assumed: false };
  if (k > 280) return { rating: 'high', factor: 0.75, assumed: false };
  return { rating: 'medium', factor: 1.0, assumed: false };
}

/**
 * Deterministic Soil Health Card nutrient requirement calculator (§4.6).
 * Computes exact product quantities from selected chemical & organic fertilizers.
 */
export function calculateFertilizerRequirements(
  params: FertilizerCalculationParams,
): FertilizerCalculationResult {
  const {
    baseNpk,
    areaHectares,
    selectedFertilizers,
    soilTest,
    targetYieldTHa,
    typicalYieldTHa = 4.0,
  } = params;

  // 1. Target yield scaling (clamp between 0.7 and 1.3)
  let yieldMultiplier = 1.0;
  if (targetYieldTHa && targetYieldTHa > 0 && typicalYieldTHa > 0) {
    const rawRatio = targetYieldTHa / typicalYieldTHa;
    yieldMultiplier = Math.min(1.3, Math.max(0.7, rawRatio));
  }

  // 2. Soil test status adjustment
  const nEval = getSoilRatingN(soilTest?.soilN);
  const pEval = getSoilRatingP(soilTest?.soilP);
  const kEval = getSoilRatingK(soilTest?.soilK);

  const assumptions: string[] = [];
  if (nEval.assumed) assumptions.push('Nitrogen (N) assumed Medium (no soil test value)');
  if (pEval.assumed) assumptions.push('Phosphorus (P) assumed Medium (no soil test value)');
  if (kEval.assumed) assumptions.push('Potassium (K) assumed Medium (no soil test value)');

  const reqN = Number((baseNpk.N * yieldMultiplier * nEval.factor).toFixed(1));
  const reqP = Number((baseNpk.P2O5 * yieldMultiplier * pEval.factor).toFixed(1));
  const reqK = Number((baseNpk.K2O * yieldMultiplier * kEval.factor).toFixed(1));

  let remainingN = reqN;
  let remainingP = reqP;
  let remainingK = reqK;

  const productAllocations: CalculatedProductAllocation[] = [];
  const organicNotes: string[] = [];
  const has = (key: FertilizerKey) => selectedFertilizers.includes(key);

  // 3. Complex Fertilizers First
  if (has('npk_10_26_26') && remainingP > 0 && remainingK > 0) {
    // 10% N, 26% P2O5, 26% K2O
    const pNeed = remainingP;
    const kgComplex = pNeed / 0.26;
    remainingP = 0;
    remainingK = Math.max(0, remainingK - kgComplex * 0.26);
    remainingN = Math.max(0, remainingN - kgComplex * 0.10);

    const kgPerHa = Number(kgComplex.toFixed(1));
    const kgTotal = Number((kgPerHa * areaHectares).toFixed(1));
    productAllocations.push({
      fertilizerKey: 'npk_10_26_26',
      name: AVAILABLE_FERTILIZERS.npk_10_26_26?.name ?? 'NPK 10:26:26',
      kg_per_ha: kgPerHa,
      kg_total: kgTotal,
      kg_per_acre: Number((kgTotal / (hectaresToAcres(areaHectares) || 1)).toFixed(1)),
      bags_50kg: Math.ceil((kgTotal / 50) * 2) / 2,
    });
  } else if (has('npk_12_32_16') && remainingP > 0) {
    // 12% N, 32% P2O5, 16% K2O
    const kgComplex = remainingP / 0.32;
    remainingP = 0;
    remainingK = Math.max(0, remainingK - kgComplex * 0.16);
    remainingN = Math.max(0, remainingN - kgComplex * 0.12);

    const kgPerHa = Number(kgComplex.toFixed(1));
    const kgTotal = Number((kgPerHa * areaHectares).toFixed(1));
    productAllocations.push({
      fertilizerKey: 'npk_12_32_16',
      name: AVAILABLE_FERTILIZERS.npk_12_32_16?.name ?? 'NPK 12:32:16',
      kg_per_ha: kgPerHa,
      kg_total: kgTotal,
      kg_per_acre: Number((kgTotal / (hectaresToAcres(areaHectares) || 1)).toFixed(1)),
      bags_50kg: Math.ceil((kgTotal / 50) * 2) / 2,
    });
  }

  // 4. Primary Phosphate: DAP (18% N, 46% P2O5) OR SSP (16% P2O5)
  if (remainingP > 0) {
    if (has('dap')) {
      const kgDap = remainingP / 0.46;
      remainingN = Math.max(0, remainingN - kgDap * 0.18);
      remainingP = 0;

      const kgPerHa = Number(kgDap.toFixed(1));
      const kgTotal = Number((kgPerHa * areaHectares).toFixed(1));
      productAllocations.push({
        fertilizerKey: 'dap',
        name: AVAILABLE_FERTILIZERS.dap?.name ?? 'DAP (18-46-0)',
        kg_per_ha: kgPerHa,
        kg_total: kgTotal,
        kg_per_acre: Number((kgTotal / (hectaresToAcres(areaHectares) || 1)).toFixed(1)),
        bags_50kg: Math.ceil((kgTotal / 50) * 2) / 2,
      });
    } else if (has('ssp')) {
      const kgSsp = remainingP / 0.16;
      remainingP = 0;

      const kgPerHa = Number(kgSsp.toFixed(1));
      const kgTotal = Number((kgPerHa * areaHectares).toFixed(1));
      productAllocations.push({
        fertilizerKey: 'ssp',
        name: AVAILABLE_FERTILIZERS.ssp?.name ?? 'SSP (0-16-0)',
        kg_per_ha: kgPerHa,
        kg_total: kgTotal,
        kg_per_acre: Number((kgTotal / (hectaresToAcres(areaHectares) || 1)).toFixed(1)),
        bags_50kg: Math.ceil((kgTotal / 50) * 2) / 2,
      });
    }
  }

  // 5. Potash: MOP (60% K2O)
  if (remainingK > 0 && has('mop')) {
    const kgMop = remainingK / 0.60;
    remainingK = 0;

    const kgPerHa = Number(kgMop.toFixed(1));
    const kgTotal = Number((kgPerHa * areaHectares).toFixed(1));
    productAllocations.push({
      fertilizerKey: 'mop',
      name: AVAILABLE_FERTILIZERS.mop?.name ?? 'MOP (0-0-60)',
      kg_per_ha: kgPerHa,
      kg_total: kgTotal,
      kg_per_acre: Number((kgTotal / (hectaresToAcres(areaHectares) || 1)).toFixed(1)),
      bags_50kg: Math.ceil((kgTotal / 50) * 2) / 2,
    });
  }

  // 6. Remaining Nitrogen: Urea (46% N) OR Ammonium Sulphate (20.5% N)
  if (remainingN > 0) {
    if (has('urea')) {
      const kgUrea = remainingN / 0.46;
      remainingN = 0;

      const kgPerHa = Number(kgUrea.toFixed(1));
      const kgTotal = Number((kgPerHa * areaHectares).toFixed(1));
      productAllocations.push({
        fertilizerKey: 'urea',
        name: AVAILABLE_FERTILIZERS.urea?.name ?? 'Urea (46-0-0)',
        kg_per_ha: kgPerHa,
        kg_total: kgTotal,
        kg_per_acre: Number((kgTotal / (hectaresToAcres(areaHectares) || 1)).toFixed(1)),
        bags_50kg: Math.ceil((kgTotal / 50) * 2) / 2,
      });
    } else if (has('ammonium_sulphate')) {
      const kgAmSulf = remainingN / 0.205;
      remainingN = 0;

      const kgPerHa = Number(kgAmSulf.toFixed(1));
      const kgTotal = Number((kgPerHa * areaHectares).toFixed(1));
      productAllocations.push({
        fertilizerKey: 'ammonium_sulphate',
        name: AVAILABLE_FERTILIZERS.ammonium_sulphate?.name ?? 'Ammonium Sulphate',
        kg_per_ha: kgPerHa,
        kg_total: kgTotal,
        kg_per_acre: Number((kgTotal / (hectaresToAcres(areaHectares) || 1)).toFixed(1)),
        bags_50kg: Math.ceil((kgTotal / 50) * 2) / 2,
      });
    }
  }

  // 7. Organic inputs (FYM / Vermicompost)
  if (has('fym')) {
    const fymTonPerHa = 5.0; // standard 5 tonnes/ha
    const fymTotalTon = Number((fymTonPerHa * areaHectares).toFixed(2));
    organicNotes.push(`Apply ${fymTonPerHa} tonnes/ha (${fymTotalTon} tonnes total) of well-decomposed Farm Yard Manure (FYM) 2-3 weeks before sowing.`);
  }

  if (has('vermicompost')) {
    const vcTonPerHa = 2.0; // standard 2 tonnes/ha
    const vcTotalTon = Number((vcTonPerHa * areaHectares).toFixed(2));
    organicNotes.push(`Apply ${vcTonPerHa} tonnes/ha (${vcTotalTon} tonnes total) of Vermicompost as basal manure.`);
  }

  return {
    adjustedNpkPerHa: {
      N: reqN,
      P2O5: reqP,
      K2O: reqK,
    },
    soilRatings: {
      nRating: nEval.rating,
      pRating: pEval.rating,
      kRating: kEval.rating,
      assumptions,
    },
    products: productAllocations,
    organicNotes,
  };
}
