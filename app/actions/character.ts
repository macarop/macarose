"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getClass } from "@/lib/domain/classes";
import { computeAC, computeMaxHp } from "@/lib/domain/rules";
import type { AbilityScores, Alignment, ClassId } from "@/lib/domain/types";

// ─── Dice helpers (server-only) ──────────────────────────────────────────────

function d(sides: number) {
  return Math.floor(Math.random() * sides) + 1;
}

function roll3d6() {
  return d(6) + d(6) + d(6);
}

// ─── Exported server actions ─────────────────────────────────────────────────

export async function checkNameAvailable(name: string): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.email) return false;
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) return true;
  const existing = await prisma.character.findFirst({
    where: { userId: user.id, name: name.trim(), archived: false },
  });
  return !existing;
}

export async function rollCharacter(classId: ClassId): Promise<{
  abilities: AbilityScores;
  hpRoll: number;
  gold: number;
}> {
  const cls = getClass(classId);
  return {
    abilities: {
      str: roll3d6(),
      int: roll3d6(),
      wis: roll3d6(),
      dex: roll3d6(),
      con: roll3d6(),
      cha: roll3d6(),
    },
    hpRoll: d(cls.hitDie),
    gold: (d(6) + d(6) + d(6)) * 10,
  };
}

export async function saveCharacter(input: {
  name: string;
  classId: ClassId;
  alignment: Alignment;
  abilities: AbilityScores;
  hpRoll: number;
  gold: number;
}): Promise<{ success: true; id: string } | { success: false; error: string }> {
  const session = await auth();
  if (!session?.user?.email) {
    return { success: false, error: "Non authentifié." };
  }

  const user = await prisma.user.upsert({
    where: { email: session.user.email },
    update: {
      name: session.user.name ?? undefined,
      image: session.user.image ?? undefined,
    },
    create: {
      email: session.user.email,
      name: session.user.name ?? null,
      image: session.user.image ?? null,
    },
  });

  const cls = getClass(input.classId);
  const maxHp = computeMaxHp(cls.hitDie, input.hpRoll, input.abilities);
  const armorClass = computeAC(input.abilities);

  try {
    const character = await prisma.character.create({
      data: {
        userId: user.id,
        name: input.name.trim(),
        classId: input.classId,
        alignment: input.alignment,
        level: 1,
        xp: 0,
        str: input.abilities.str,
        int: input.abilities.int,
        wis: input.abilities.wis,
        dex: input.abilities.dex,
        con: input.abilities.con,
        cha: input.abilities.cha,
        maxHp,
        currentHp: maxHp,
        armorClass,
        gold: input.gold,
      },
    });
    return { success: true, id: character.id };
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === "P2002") {
      return { success: false, error: "Ce nom est déjà utilisé par un de vos personnages." };
    }
    return { success: false, error: "Erreur lors de la sauvegarde." };
  }
}
