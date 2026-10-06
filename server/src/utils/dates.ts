export function daysBetween(dateA: string | Date, dateB: string | Date = new Date()): number {
  const tA = new Date(dateA).getTime();
  const tB = new Date(dateB).getTime();
  return Math.floor((tB - tA) / (1000 * 60 * 60 * 24));
}

export function toIsoDate(d: Date = new Date()): string {
  return d.toISOString().split('T')[0]!;
}

export function getCurrentIndianSeason(month: number = new Date().getMonth() + 1): 'kharif' | 'rabi' | 'zaid' {
  // June - October: Kharif
  if (month >= 6 && month <= 10) return 'kharif';
  // November - March: Rabi
  if (month === 11 || month === 12 || (month >= 1 && month <= 3)) return 'rabi';
  // April - May: Zaid
  return 'zaid';
}
