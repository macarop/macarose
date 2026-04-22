import type { AbilityScores, Alignment } from "./types";

// OSE modifier table (SRD)
export function getModifier(score: number): number {
  if (score === 3) return -3;
  if (score <= 5) return -2;
  if (score <= 8) return -1;
  if (score <= 12) return 0;
  if (score <= 15) return 1;
  if (score <= 17) return 2;
  return 3;
}

export function getModifierLabel(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

const ALIGNMENT_LANGUAGES: Record<Alignment, string> = {
  lawful: "Loyal",
  neutral: "Neutre",
  chaotic: "Chaotique",
};

export function computeLanguages(
  abilities: AbilityScores,
  alignment: Alignment,
  classLanguages: string[]
): { known: string[]; extraSlots: number } {
  const base = ["Commun", ALIGNMENT_LANGUAGES[alignment], ...classLanguages];
  const extraSlots = Math.max(0, getModifier(abilities.int));
  return { known: [...new Set(base)], extraSlots };
}

// Descending AC: base 9, lower = better. DEX mod lowers AC.
export function computeAC(abilities: AbilityScores): number {
  return 9 - getModifier(abilities.dex);
}

export function computeMaxHp(
  hitDie: number,
  roll: number,
  abilities: AbilityScores
): number {
  return Math.max(1, roll + getModifier(abilities.con));
}

export function meetsRequirements(
  abilities: AbilityScores,
  requirements: Partial<AbilityScores>
): boolean {
  return (Object.entries(requirements) as [keyof AbilityScores, number][]).every(
    ([key, min]) => abilities[key] >= min
  );
}

export function getXpBonus(
  primeRequisite: keyof AbilityScores,
  abilities: AbilityScores
): string {
  const score = abilities[primeRequisite];
  if (score >= 16) return "+10%";
  if (score >= 13) return "+5%";
  if (score >= 9) return "0%";
  if (score >= 6) return "-10%";
  return "-20%";
}
