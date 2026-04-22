import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getClass } from "@/lib/domain/classes";
import { getModifier, getModifierLabel, computeLanguages } from "@/lib/domain/rules";
import type { AbilityScores, Alignment } from "@/lib/domain/types";
import Link from "next/link";
import { notFound } from "next/navigation";

const ABILITY_KEYS: (keyof AbilityScores)[] = ["str", "int", "wis", "dex", "con", "cha"];
const ABILITY_LABELS: Record<keyof AbilityScores, string> = {
  str: "FOR", int: "INT", wis: "SAG", dex: "DEX", con: "CON", cha: "CHA",
};
const ABILITY_NAMES: Record<keyof AbilityScores, string> = {
  str: "Force", int: "Intelligence", wis: "Sagesse",
  dex: "Dextérité", con: "Constitution", cha: "Charisme",
};
const ALIGNMENT_LABELS: Record<string, string> = {
  lawful: "Loyal", neutral: "Neutre", chaotic: "Chaotique",
};

export default async function CharacterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const character = await prisma.character.findUnique({ where: { id } });
  if (!character || character.archived) notFound();

  // Verify ownership
  const user = session?.user?.email
    ? await prisma.user.findUnique({ where: { email: session.user.email } })
    : null;
  if (!user || character.userId !== user.id) notFound();

  const cls = getClass(character.classId as "fighter" | "dwarf");
  const abilities: AbilityScores = {
    str: character.str, int: character.int, wis: character.wis,
    dex: character.dex, con: character.con, cha: character.cha,
  };
  const { known: languages, extraSlots } = computeLanguages(
    abilities,
    character.alignment as Alignment,
    cls.languages
  );

  const section = (title: string, children: React.ReactNode) => (
    <div className="rounded-xl border p-5" style={{ background: "var(--muted)", borderColor: "var(--border)" }}>
      <h3 className="text-xs font-semibold uppercase tracking-wide mb-4"
        style={{ color: "var(--accent)", opacity: 0.8 }}>{title}</h3>
      {children}
    </div>
  );

  const row = (label: string, value: React.ReactNode) => (
    <div className="flex justify-between items-center py-1.5 border-b last:border-0"
      style={{ borderColor: "var(--border)" }}>
      <span className="text-sm" style={{ color: "var(--foreground)", opacity: 0.5 }}>{label}</span>
      <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{value}</span>
    </div>
  );

  return (
    <main className="min-h-screen px-4 py-10" style={{ background: "var(--background)" }}>
      <div className="max-w-3xl mx-auto">

        {/* Nav */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/characters"
            className="text-sm transition-opacity hover:opacity-100"
            style={{ color: "var(--foreground)", opacity: 0.4 }}>
            ← Mes personnages
          </Link>
        </div>

        {/* Hero */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold" style={{ color: "var(--accent)" }}>{character.name}</h1>
          <div className="flex items-center gap-3 mt-2 text-sm" style={{ color: "var(--foreground)", opacity: 0.5 }}>
            <span>{cls.name}</span>
            <span>·</span>
            <span>Niveau {character.level}</span>
            <span>·</span>
            <span>{ALIGNMENT_LABELS[character.alignment] ?? character.alignment}</span>
            <span>·</span>
            <span>{character.xp} XP</span>
          </div>
        </div>

        {/* Two-column grid on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Ability scores */}
          {section("Caractéristiques",
            <div>
              {ABILITY_KEYS.map((key) => {
                const score = abilities[key];
                const mod = getModifier(score);
                const isPrime = key === cls.primeRequisite;
                return (
                  <div key={key} className="flex items-center gap-3 py-1.5 border-b last:border-0"
                    style={{ borderColor: "var(--border)" }}>
                    <span className="w-8 text-xs font-semibold" style={{ color: "var(--foreground)", opacity: 0.4 }}>
                      {ABILITY_LABELS[key]}
                    </span>
                    <span className="w-32 text-xs hidden sm:block" style={{ color: "var(--foreground)", opacity: 0.4 }}>
                      {ABILITY_NAMES[key]}
                    </span>
                    <span className="text-xl font-bold w-10 text-center" style={{ color: "var(--foreground)" }}>
                      {score}
                    </span>
                    <span className="w-10 text-sm font-medium"
                      style={{ color: mod > 0 ? "#4ade80" : mod < 0 ? "#f87171" : "var(--foreground)", opacity: mod === 0 ? 0.4 : 1 }}>
                      {getModifierLabel(mod)}
                    </span>
                    {isPrime && (
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(200,169,110,0.15)", color: "var(--accent)" }}>
                        principale
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Combat */}
          {section("Combat", <>
            {row("Points de vie", <span className="font-bold text-base">{character.currentHp} / {character.maxHp}</span>)}
            {row("Classe d'armure", character.armorClass)}
            {row("Bonus d'attaque", "+0")}
            {row("Dé de vie", `d${cls.hitDie}`)}
            {row("Or", `${character.gold} po`)}
          </>)}

          {/* Saving throws */}
          {section("Jets de sauvegarde", <>
            {row("Mort / Poison", cls.saves.death)}
            {row("Baguettes", cls.saves.wands)}
            {row("Paralysie / Pétrification", cls.saves.paralysis)}
            {row("Souffles", cls.saves.breath)}
            {row("Sorts / Sceptres / Bâtons", cls.saves.spells)}
          </>)}

          {/* Identity & Languages */}
          {section("Identité & Langues", <>
            {row("Classe", cls.name)}
            {row("Alignement", ALIGNMENT_LABELS[character.alignment] ?? character.alignment)}
            {row("Niveau", character.level)}
            {row("XP", character.xp)}
            <div className="pt-2 mt-1 border-t" style={{ borderColor: "var(--border)" }}>
              <div className="text-xs mb-1" style={{ color: "var(--foreground)", opacity: 0.4 }}>Langues connues</div>
              <div className="text-sm" style={{ color: "var(--foreground)" }}>{languages.join(", ")}</div>
              {extraSlots > 0 && (
                <div className="text-xs mt-1" style={{ color: "var(--foreground)", opacity: 0.4 }}>
                  +{extraSlots} langue(s) supplémentaire(s) à choisir
                </div>
              )}
            </div>
          </>)}

        </div>

        {/* Notes (full width) */}
        {character.notes && (
          <div className="mt-4 rounded-xl border p-5"
            style={{ background: "var(--muted)", borderColor: "var(--border)" }}>
            <h3 className="text-xs font-semibold uppercase tracking-wide mb-3"
              style={{ color: "var(--accent)", opacity: 0.8 }}>Notes</h3>
            <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--foreground)", opacity: 0.7 }}>
              {character.notes}
            </p>
          </div>
        )}

      </div>
    </main>
  );
}
