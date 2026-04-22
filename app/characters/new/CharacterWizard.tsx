"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  checkNameAvailable,
  rollCharacter,
  saveCharacter,
} from "@/app/actions/character";
import { OSE_CLASSES } from "@/lib/domain/classes";
import {
  getModifier,
  getModifierLabel,
  computeAC,
  computeMaxHp,
  computeLanguages,
  meetsRequirements,
  getXpBonus,
} from "@/lib/domain/rules";
import type { AbilityScores, Alignment, ClassId } from "@/lib/domain/types";

// ─── Types ───────────────────────────────────────────────────────────────────

type WizardData = {
  name: string;
  classId: ClassId | null;
  abilities: AbilityScores | null;
  hpRoll: number | null;
  gold: number | null;
  alignment: Alignment | null;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const ABILITY_KEYS: (keyof AbilityScores)[] = [
  "str", "int", "wis", "dex", "con", "cha",
];

const ABILITY_LABELS: Record<keyof AbilityScores, string> = {
  str: "FOR", int: "INT", wis: "SAG", dex: "DEX", con: "CON", cha: "CHA",
};

const ABILITY_NAMES: Record<keyof AbilityScores, string> = {
  str: "Force", int: "Intelligence", wis: "Sagesse",
  dex: "Dextérité", con: "Constitution", cha: "Charisme",
};

const ALIGNMENT_LABELS: Record<Alignment, string> = {
  lawful: "Loyal", neutral: "Neutre", chaotic: "Chaotique",
};

const ALIGNMENT_DESCRIPTIONS: Record<Alignment, string> = {
  lawful: "Défenseur de l'ordre, des lois et de la civilisation.",
  neutral: "Équilibre entre la loi et le chaos.",
  chaotic: "Force de désordre, d'individualisme et de changement.",
};

const STEP_LABELS = ["Nom", "Classe", "Caractéristiques", "Alignement", "Récapitulatif"];

// ─── Character sheet preview (left panel) ────────────────────────────────────

function CharacterSheetPreview({ data }: { data: WizardData }) {
  const cls = OSE_CLASSES.find((c) => c.id === data.classId) ?? null;
  const ab = data.abilities;
  const maxHp =
    cls && ab && data.hpRoll != null
      ? computeMaxHp(cls.hitDie, data.hpRoll, ab)
      : null;
  const ac = ab ? computeAC(ab) : null;
  const languages =
    ab && data.alignment && cls
      ? computeLanguages(ab, data.alignment, cls.languages)
      : null;

  const section = (title: string, children: React.ReactNode) => (
    <div className="mb-3 pb-3 border-b last:border-0 last:mb-0 last:pb-0"
      style={{ borderColor: "var(--border)" }}>
      <div className="text-xs font-semibold mb-1.5 uppercase tracking-wide"
        style={{ color: "var(--accent)", opacity: 0.8 }}>
        {title}
      </div>
      {children}
    </div>
  );

  const row = (label: string, value: React.ReactNode) => (
    <div className="flex justify-between items-center py-0.5">
      <span className="text-xs" style={{ color: "var(--foreground)", opacity: 0.5 }}>{label}</span>
      <span className="text-xs font-medium" style={{ color: "var(--foreground)" }}>{value}</span>
    </div>
  );

  const dash = <span style={{ opacity: 0.25 }}>—</span>;

  return (
    <div className="rounded-xl border p-4"
      style={{ background: "var(--muted)", borderColor: "var(--border)" }}>

      {/* Identity */}
      <div className="mb-3 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="font-bold text-base truncate" style={{ color: "var(--accent)" }}>
          {data.name || <span style={{ opacity: 0.3 }}>— Personnage —</span>}
        </div>
        <div className="text-xs mt-0.5" style={{ color: "var(--foreground)", opacity: 0.5 }}>
          {cls ? cls.name : "—"} · Niveau 1
        </div>
        <div className="text-xs mt-0.5" style={{ color: "var(--foreground)", opacity: 0.5 }}>
          {data.alignment ? ALIGNMENT_LABELS[data.alignment] : "—"}
        </div>
      </div>

      {/* Ability scores */}
      {section("Caractéristiques",
        ABILITY_KEYS.map((key) => {
          const score = ab ? ab[key] : null;
          const mod = score != null ? getModifier(score) : null;
          return (
            <div key={key} className="flex items-center gap-2 py-0.5">
              <span className="w-7 text-xs" style={{ color: "var(--foreground)", opacity: 0.5 }}>
                {ABILITY_LABELS[key]}
              </span>
              <span className="w-6 text-xs font-bold text-center" style={{ color: "var(--foreground)" }}>
                {score ?? dash}
              </span>
              <span className="text-xs w-7 text-right"
                style={{
                  color: mod != null ? (mod > 0 ? "#4ade80" : mod < 0 ? "#f87171" : "var(--foreground)") : "var(--foreground)",
                  opacity: mod === 0 ? 0.4 : mod != null ? 1 : 0.25,
                }}>
                {mod != null ? getModifierLabel(mod) : "—"}
              </span>
            </div>
          );
        })
      )}

      {/* Combat */}
      {section("Combat", <>
        {row("PV", maxHp != null ? `${maxHp} / ${maxHp}` : dash)}
        {row("CA", ac != null ? ac : dash)}
        {row("Attaque", "+0")}
        {cls && row("Dé de vie", `d${cls.hitDie}`)}
      </>)}

      {/* Saving throws */}
      {section("Jets de sauvegarde", <>
        {row("Mort / Poison", cls ? cls.saves.death : dash)}
        {row("Baguettes", cls ? cls.saves.wands : dash)}
        {row("Paralysie", cls ? cls.saves.paralysis : dash)}
        {row("Souffles", cls ? cls.saves.breath : dash)}
        {row("Sorts", cls ? cls.saves.spells : dash)}
      </>)}

      {/* Languages */}
      {section("Langues",
        languages ? (
          <>
            <div className="text-xs" style={{ color: "var(--foreground)", opacity: 0.7 }}>
              {languages.known.join(", ")}
            </div>
            {languages.extraSlots > 0 && (
              <div className="text-xs mt-0.5" style={{ color: "var(--foreground)", opacity: 0.4 }}>
                +{languages.extraSlots} langue(s) à choisir
              </div>
            )}
          </>
        ) : <div className="text-xs" style={{ opacity: 0.25 }}>—</div>
      )}

      {/* Gold */}
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: "var(--accent)", opacity: 0.8 }}>Or</span>
        <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
          {data.gold != null ? `${data.gold} po` : dash}
        </span>
      </div>
    </div>
  );
}

// ─── Step 1 : Name ────────────────────────────────────────────────────────────

function NameStep({
  value, onChange, onNext,
}: {
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
}) {
  const [error, setError] = useState("");
  const [checking, startChecking] = useTransition();

  const handleNext = () => {
    if (!value.trim()) { setError("Le nom ne peut pas être vide."); return; }
    startChecking(async () => {
      const ok = await checkNameAvailable(value.trim());
      if (!ok) { setError("Ce nom est déjà utilisé par un de vos personnages."); return; }
      setError("");
      onNext();
    });
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-1" style={{ color: "var(--foreground)" }}>
        Nom du personnage
      </h2>
      <p className="text-sm mb-6" style={{ color: "var(--foreground)", opacity: 0.5 }}>
        Ce nom doit être unique parmi vos personnages.
      </p>
      <input
        type="text"
        value={value}
        onChange={(e) => { onChange(e.target.value); setError(""); }}
        onKeyDown={(e) => e.key === "Enter" && handleNext()}
        placeholder="Ex : Thorin Martelferge"
        maxLength={40}
        autoFocus
        className="w-full rounded-lg px-4 py-3 text-sm outline-none border"
        style={{
          background: "var(--background)",
          borderColor: error ? "#ef4444" : "var(--border)",
          color: "var(--foreground)",
        }}
      />
      {error && <p className="mt-2 text-xs" style={{ color: "#ef4444" }}>{error}</p>}
      <button
        onClick={handleNext}
        disabled={checking || !value.trim()}
        className="mt-6 w-full py-3 rounded-lg text-sm font-medium transition-opacity disabled:opacity-40 cursor-pointer"
        style={{ background: "var(--accent)", color: "var(--background)" }}
      >
        {checking ? "Vérification…" : "Continuer →"}
      </button>
    </div>
  );
}

// ─── Step 2 : Class ───────────────────────────────────────────────────────────

function ClassStep({ onSelect }: { onSelect: (id: ClassId) => void }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-1" style={{ color: "var(--foreground)" }}>
        Choisissez votre classe
      </h2>
      <p className="text-sm mb-6" style={{ color: "var(--foreground)", opacity: 0.5 }}>
        Cliquez sur une classe pour continuer.
      </p>
      <div className="flex flex-col gap-3">
        {OSE_CLASSES.map((cls) => {
          const reqs = (Object.entries(cls.requirements) as [keyof AbilityScores, number][])
            .map(([k, v]) => `${ABILITY_LABELS[k]} ${v}+`)
            .join(", ");
          return (
            <button key={cls.id} onClick={() => onSelect(cls.id)}
              className="w-full text-left rounded-xl border p-5 transition-all hover:opacity-90 cursor-pointer"
              style={{ background: "var(--background)", borderColor: "var(--border)" }}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-base" style={{ color: "var(--accent)" }}>{cls.name}</div>
                  <div className="text-sm mt-1" style={{ color: "var(--foreground)", opacity: 0.6 }}>{cls.description}</div>
                </div>
                <div className="ml-4 shrink-0 text-right">
                  <div className="text-xs font-medium" style={{ color: "var(--foreground)", opacity: 0.5 }}>d{cls.hitDie} PV</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--foreground)", opacity: 0.4 }}>
                    {reqs || "Aucun prérequis"}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 3 : Ability scores ──────────────────────────────────────────────────

function AbilityStep({
  classId, abilities, hpRoll, gold, onRoll, onNext,
}: {
  classId: ClassId;
  abilities: AbilityScores | null;
  hpRoll: number | null;
  gold: number | null;
  onRoll: (r: { abilities: AbilityScores; hpRoll: number; gold: number }) => void;
  onNext: () => void;
}) {
  const [rolling, startRoll] = useTransition();
  const cls = OSE_CLASSES.find((c) => c.id === classId)!;
  const reqsMet = abilities ? meetsRequirements(abilities, cls.requirements) : true;
  const maxHp = abilities && hpRoll != null ? computeMaxHp(cls.hitDie, hpRoll, abilities) : null;

  const handleRoll = () => {
    startRoll(async () => { onRoll(await rollCharacter(classId)); });
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-1" style={{ color: "var(--foreground)" }}>
        Caractéristiques
      </h2>
      <p className="text-sm mb-6" style={{ color: "var(--foreground)", opacity: 0.5 }}>
        3d6 dans l&apos;ordre — {cls.name}.
      </p>

      {!reqsMet && abilities && (
        <div className="mb-4 px-4 py-3 rounded-lg text-xs"
          style={{ background: "rgba(239,68,68,0.1)", borderLeft: "3px solid #ef4444", color: "#ef4444" }}>
          ⚠ CON {abilities.con} — le Nain exige CON 9+. Vous pouvez relancer.
        </div>
      )}

      {abilities ? (
        <div className="mb-6">
          <div className="rounded-xl border mb-4 overflow-hidden"
            style={{ borderColor: "var(--border)" }}>
            {ABILITY_KEYS.map((key) => {
              const score = abilities[key];
              const mod = getModifier(score);
              const isPrime = key === cls.primeRequisite;
              return (
                <div key={key}
                  className="flex items-center gap-3 px-4 py-2.5 border-b last:border-0"
                  style={{
                    borderColor: "var(--border)",
                    background: isPrime ? "rgba(200,169,110,0.06)" : "var(--background)",
                  }}>
                  <span className="w-7 text-xs" style={{ color: "var(--foreground)", opacity: 0.5 }}>
                    {ABILITY_LABELS[key]}
                  </span>
                  <span className="w-28 text-xs hidden sm:block" style={{ color: "var(--foreground)", opacity: 0.4 }}>
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
                      style={{ background: "rgba(200,169,110,0.2)", color: "var(--accent)" }}>
                      principale
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="rounded-lg p-3 text-center border"
              style={{ background: "var(--background)", borderColor: "var(--border)" }}>
              <div className="text-xs mb-1" style={{ opacity: 0.5 }}>PV max</div>
              <div className="text-2xl font-bold" style={{ color: "var(--accent)" }}>{maxHp}</div>
              <div className="text-xs mt-0.5" style={{ opacity: 0.4 }}>
                {hpRoll} (d{cls.hitDie}) {getModifier(abilities.con) >= 0 ? "+" : ""}{getModifier(abilities.con)} CON
              </div>
            </div>
            <div className="rounded-lg p-3 text-center border"
              style={{ background: "var(--background)", borderColor: "var(--border)" }}>
              <div className="text-xs mb-1" style={{ opacity: 0.5 }}>Or de départ</div>
              <div className="text-2xl font-bold" style={{ color: "var(--accent)" }}>{gold} po</div>
              <div className="text-xs mt-0.5" style={{ opacity: 0.4 }}>3d6 × 10</div>
            </div>
          </div>

          <div className="text-xs text-center" style={{ opacity: 0.4 }}>
            Bonus XP ({ABILITY_NAMES[cls.primeRequisite]}) : {getXpBonus(cls.primeRequisite, abilities)}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border p-12 text-center mb-6"
          style={{ background: "var(--background)", borderColor: "var(--border)" }}>
          <div className="text-4xl mb-3">🎲</div>
          <p className="text-sm" style={{ opacity: 0.5 }}>Cliquez pour lancer les dés.</p>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={handleRoll} disabled={rolling}
          className="flex-1 py-3 rounded-lg text-sm font-medium transition-opacity disabled:opacity-40 cursor-pointer border"
          style={{
            background: abilities ? "transparent" : "var(--accent)",
            color: abilities ? "var(--foreground)" : "var(--background)",
            borderColor: abilities ? "var(--border)" : "transparent",
          }}>
          {rolling ? "Lancement…" : abilities ? "🎲 Relancer" : "🎲 Lancer les dés"}
        </button>
        {abilities && (
          <button onClick={onNext} disabled={!reqsMet}
            className="flex-1 py-3 rounded-lg text-sm font-medium transition-opacity disabled:opacity-40 cursor-pointer"
            style={{ background: "var(--accent)", color: "var(--background)" }}>
            Continuer →
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Step 4 : Alignment ───────────────────────────────────────────────────────

function AlignmentStep({ onSelect }: { onSelect: (a: Alignment) => void }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-1" style={{ color: "var(--foreground)" }}>
        Alignement
      </h2>
      <p className="text-sm mb-6" style={{ color: "var(--foreground)", opacity: 0.5 }}>
        L&apos;alignement définit la vision du monde de votre personnage.
      </p>
      <div className="flex flex-col gap-3">
        {(["lawful", "neutral", "chaotic"] as Alignment[]).map((a) => (
          <button key={a} onClick={() => onSelect(a)}
            className="w-full text-left rounded-xl border p-5 transition-all hover:opacity-90 cursor-pointer"
            style={{ background: "var(--background)", borderColor: "var(--border)" }}>
            <div className="font-bold" style={{ color: "var(--accent)" }}>{ALIGNMENT_LABELS[a]}</div>
            <div className="text-sm mt-1" style={{ color: "var(--foreground)", opacity: 0.6 }}>{ALIGNMENT_DESCRIPTIONS[a]}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Step 5 : Review & Save ───────────────────────────────────────────────────

function ReviewStep({ data }: { data: Required<Omit<WizardData, "classId" | "abilities" | "alignment" | "hpRoll" | "gold">> & {
  classId: ClassId; abilities: AbilityScores; alignment: Alignment; hpRoll: number; gold: number;
}}) {
  const [saving, startSave] = useTransition();
  const [error, setError] = useState("");
  const router = useRouter();

  const cls = OSE_CLASSES.find((c) => c.id === data.classId)!;
  const maxHp = computeMaxHp(cls.hitDie, data.hpRoll, data.abilities);
  const ac = computeAC(data.abilities);
  const { known: langs, extraSlots } = computeLanguages(data.abilities, data.alignment, cls.languages);

  const handleSave = () => {
    startSave(async () => {
      const result = await saveCharacter({
        name: data.name,
        classId: data.classId,
        alignment: data.alignment,
        abilities: data.abilities,
        hpRoll: data.hpRoll,
        gold: data.gold,
      });
      if (result.success) {
        router.push("/characters");
      } else {
        setError(result.error);
      }
    });
  };

  const row = (label: string, value: React.ReactNode) => (
    <div className="flex justify-between items-start py-1.5 border-b last:border-0"
      style={{ borderColor: "var(--border)" }}>
      <span className="text-sm" style={{ opacity: 0.5 }}>{label}</span>
      <span className="text-sm font-medium text-right max-w-[55%]" style={{ color: "var(--foreground)" }}>{value}</span>
    </div>
  );

  return (
    <div>
      <h2 className="text-xl font-semibold mb-1" style={{ color: "var(--foreground)" }}>
        Votre personnage est prêt
      </h2>
      <p className="text-sm mb-6" style={{ color: "var(--foreground)", opacity: 0.5 }}>
        Vérifiez avant de sauvegarder.
      </p>

      <div className="rounded-xl border p-4 mb-5"
        style={{ background: "var(--background)", borderColor: "var(--border)" }}>
        {row("Nom", <span style={{ color: "var(--accent)" }}>{data.name}</span>)}
        {row("Classe", cls.name)}
        {row("Alignement", ALIGNMENT_LABELS[data.alignment])}
        {row("PV max", maxHp)}
        {row("Classe d'armure", ac)}
        {row("Or de départ", `${data.gold} po`)}
        {row("Jets de sauvegarde",
          <span className="text-xs leading-relaxed">
            Mort {cls.saves.death} · Bag. {cls.saves.wands} · Para. {cls.saves.paralysis} · Souf. {cls.saves.breath} · Sorts {cls.saves.spells}
          </span>
        )}
        {row("Langues",
          <span>
            {langs.join(", ")}
            {extraSlots > 0 && <span style={{ opacity: 0.5 }}> +{extraSlots} à choisir</span>}
          </span>
        )}
      </div>

      {error && <p className="mb-4 text-sm" style={{ color: "#ef4444" }}>{error}</p>}

      <button onClick={handleSave} disabled={saving}
        className="w-full py-3 rounded-lg text-sm font-medium transition-opacity disabled:opacity-40 cursor-pointer"
        style={{ background: "var(--accent)", color: "var(--background)" }}>
        {saving ? "Sauvegarde en cours…" : "💾 Sauvegarder le personnage"}
      </button>
    </div>
  );
}

// ─── Main wizard ──────────────────────────────────────────────────────────────

export default function CharacterWizard() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>({
    name: "", classId: null, abilities: null, hpRoll: null, gold: null, alignment: null,
  });

  const update = (patch: Partial<WizardData>) => setData((d) => ({ ...d, ...patch }));
  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => s - 1);

  return (
    <div className="flex gap-8 items-start">
      {/* Left: sticky character sheet (desktop only) */}
      <div className="hidden lg:block w-56 xl:w-64 shrink-0 sticky top-6">
        <CharacterSheetPreview data={data} />
      </div>

      {/* Right: wizard */}
      <div className="flex-1 min-w-0">
        {/* Progress bar */}
        <div className="flex items-center gap-1.5 mb-8 flex-wrap">
          {STEP_LABELS.map((label, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0"
                style={{
                  background: i + 1 === step ? "var(--accent)" : i + 1 < step ? "rgba(200,169,110,0.3)" : "var(--muted)",
                  color: i + 1 === step ? "var(--background)" : "var(--foreground)",
                  opacity: i + 1 > step ? 0.4 : 1,
                  border: i + 1 >= step ? "1px solid var(--border)" : "none",
                }}>
                {i + 1 < step ? "✓" : i + 1}
              </div>
              <span className="text-xs hidden sm:inline"
                style={{ color: "var(--foreground)", opacity: i + 1 === step ? 1 : 0.35 }}>
                {label}
              </span>
              {i < STEP_LABELS.length - 1 && (
                <div className="w-3 h-px mx-0.5" style={{ background: "var(--border)" }} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="rounded-2xl border p-6"
          style={{ background: "var(--muted)", borderColor: "var(--border)" }}>
          {step === 1 && (
            <NameStep value={data.name}
              onChange={(name) => update({ name })}
              onNext={next} />
          )}
          {step === 2 && (
            <ClassStep onSelect={(classId) => {
              update({ classId, abilities: null, hpRoll: null, gold: null });
              next();
            }} />
          )}
          {step === 3 && data.classId && (
            <AbilityStep
              classId={data.classId}
              abilities={data.abilities}
              hpRoll={data.hpRoll}
              gold={data.gold}
              onRoll={({ abilities, hpRoll, gold }) => update({ abilities, hpRoll, gold })}
              onNext={next} />
          )}
          {step === 4 && (
            <AlignmentStep onSelect={(alignment) => { update({ alignment }); next(); }} />
          )}
          {step === 5 &&
            data.classId && data.abilities && data.alignment &&
            data.hpRoll != null && data.gold != null && (
            <ReviewStep data={{
              name: data.name,
              classId: data.classId,
              abilities: data.abilities,
              alignment: data.alignment,
              hpRoll: data.hpRoll,
              gold: data.gold,
            }} />
          )}
        </div>

        {step > 1 && (
          <button onClick={back}
            className="mt-3 text-sm transition-opacity hover:opacity-100 cursor-pointer"
            style={{ color: "var(--foreground)", opacity: 0.4 }}>
            ← Étape précédente
          </button>
        )}
      </div>
    </div>
  );
}
