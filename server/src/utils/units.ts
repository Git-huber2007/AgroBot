import type { AreaUnit } from '@cropsage/shared';

const UNIT_TO_HECTARES: Record<AreaUnit, number> = {
  hectare: 1.0,
  acre: 0.404686,
  bigha: 0.252928,
  guntha: 0.010117,
};

export function convertToHectares(value: number, unit: AreaUnit): number {
  const factor = UNIT_TO_HECTARES[unit] ?? 1.0;
  return Number((value * factor).toFixed(4));
}

export function hectaresToAcres(ha: number): number {
  return Number((ha * 2.47105).toFixed(2));
}

export function formatArea(ha: number): { hectares: number; acres: number } {
  return {
    hectares: Number(ha.toFixed(2)),
    acres: hectaresToAcres(ha),
  };
}
