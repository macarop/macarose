export type AbilityScores = {
  str: number;
  int: number;
  wis: number;
  dex: number;
  con: number;
  cha: number;
};

export type Alignment = "lawful" | "neutral" | "chaotic";

export type SavingThrows = {
  death: number;
  wands: number;
  paralysis: number;
  breath: number;
  spells: number;
};

export type ClassId = "fighter" | "dwarf";

export type OseClass = {
  id: ClassId;
  name: string;
  hitDie: number;
  primeRequisite: keyof AbilityScores;
  requirements: Partial<AbilityScores>;
  saves: SavingThrows;
  languages: string[];
  description: string;
};
