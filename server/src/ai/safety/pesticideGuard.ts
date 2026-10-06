import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ChemicalTreatmentSchema } from '@cropsage/shared';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface BannedPesticidesConfig {
  banned: string[];
  restricted: Array<{ active_ingredient: string; restriction: string }>;
}

let cachedBannedList: string[] = [];

try {
  const jsonPath = path.resolve(__dirname, '../../config/bannedPesticides.json');
  if (fs.existsSync(jsonPath)) {
    const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf-8')) as BannedPesticidesConfig;
    cachedBannedList = (raw.banned || []).map(p => p.toLowerCase().trim());
  }
} catch {
  // Fallback defaults
  cachedBannedList = [
    'aldrin', 'chlordane', 'ddt', 'dieldrin', 'endrin', 'endosulfan',
    'heptachlor', 'lindane', 'methyl parathion', 'phosphamidon',
    'dicofol', 'dinocap', 'methomyl', 'monocrotophos', 'carbofuran',
    'phorate', 'triazophos', 'paraquat dichloride', 'chlorpyrifos',
  ];
}

type ChemicalItem = z.infer<typeof ChemicalTreatmentSchema>;

export interface PesticideCheckResult {
  hasBanned: boolean;
  hasBrandName: boolean;
  violations: string[];
}

/**
 * Checks a chemical recommendation against the Indian regulatory banned list and brand name marks.
 */
export function checkPesticideSafety(chemicalItem: ChemicalItem): PesticideCheckResult {
  const violations: string[] = [];
  const ingredient = chemicalItem.active_ingredient.toLowerCase().trim();

  // 1. Check for proprietary trademark/registered marks
  let hasBrandName = false;
  if (chemicalItem.active_ingredient.includes('®') || chemicalItem.active_ingredient.includes('™')) {
    hasBrandName = true;
    violations.push(`Proprietary brand name mark detected in: "${chemicalItem.active_ingredient}". Only generic active ingredients are permitted.`);
  }

  // 2. Check banned ingredient list
  let hasBanned = false;
  for (const banned of cachedBannedList) {
    if (ingredient.includes(banned)) {
      hasBanned = true;
      violations.push(`Banned or restricted pesticide detected: "${chemicalItem.active_ingredient}". Banned under Indian CIB&RC regulations.`);
      break;
    }
  }

  return {
    hasBanned,
    hasBrandName,
    violations,
  };
}

/**
 * Validates a list of chemical treatments and cleanses any banned items as a safety backstop.
 */
export function sanitizeChemicalTreatments(chemicals: ChemicalItem[]): {
  cleanList: ChemicalItem[];
  removedWarnings: string[];
} {
  const cleanList: ChemicalItem[] = [];
  const removedWarnings: string[] = [];

  for (const chem of chemicals) {
    const check = checkPesticideSafety(chem);
    if (check.hasBanned) {
      removedWarnings.push(
        `Safety notice: Recommended chemical containing '${chem.active_ingredient}' was removed because it is banned or restricted in India. Consult your local KVK for safe alternative bio-pesticides.`,
      );
    } else {
      // Clean up any remaining brand symbols if present
      const cleaned = {
        ...chem,
        active_ingredient: chem.active_ingredient.replace(/[®™]/g, '').trim(),
      };
      cleanList.push(cleaned);
    }
  }

  return {
    cleanList,
    removedWarnings,
  };
}
