import type { ClassId, OseClass } from "./types";

// OSE SRD — Classic Fantasy
export const OSE_CLASSES: OseClass[] = [
  {
    id: "fighter",
    name: "Guerrier",
    hitDie: 8,
    primeRequisite: "str",
    requirements: {},
    saves: { death: 12, wands: 13, paralysis: 14, breath: 15, spells: 17 },
    languages: [],
    description: "Maître des armes et de l'armure. Aucun prérequis.",
  },
  {
    id: "dwarf",
    name: "Nain",
    hitDie: 8,
    primeRequisite: "str",
    requirements: { con: 9 },
    saves: { death: 8, wands: 9, paralysis: 10, breath: 13, spells: 12 },
    languages: ["Nain", "Gnome", "Gobelin", "Kobold"],
    description:
      "Guerrier robuste avec une résistance naturelle à la magie. Infravision 18 m. CON 9 minimum.",
  },
];

export function getClass(id: ClassId): OseClass {
  const cls = OSE_CLASSES.find((c) => c.id === id);
  if (!cls) throw new Error(`Classe inconnue : ${id}`);
  return cls;
}
