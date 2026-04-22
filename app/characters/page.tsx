import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { OSE_CLASSES } from "@/lib/domain/classes";
import Link from "next/link";

async function getUserCharacters(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      characters: {
        where: { archived: false },
        orderBy: { updatedAt: "desc" },
      },
    },
  });
  return user?.characters ?? [];
}

const ALIGNMENT_LABELS: Record<string, string> = {
  lawful: "Loyal",
  neutral: "Neutre",
  chaotic: "Chaotique",
};

export default async function CharactersPage() {
  const session = await auth();
  const characters = session?.user?.email
    ? await getUserCharacters(session.user.email)
    : [];

  return (
    <main className="min-h-screen px-4 py-12" style={{ background: "var(--background)" }}>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-2xl font-bold" style={{ color: "var(--accent)" }}>⚔️ OSE App</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm" style={{ color: "var(--foreground)", opacity: 0.5 }}>
              {session?.user?.email}
            </span>
            <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
              <button type="submit"
                className="text-sm px-3 py-1.5 rounded-lg border transition-opacity hover:opacity-70 cursor-pointer"
                style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
                Déconnexion
              </button>
            </form>
          </div>
        </div>

        {/* Title + new button */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
            Mes personnages
            {characters.length > 0 && (
              <span className="ml-2 text-sm font-normal" style={{ opacity: 0.4 }}>
                ({characters.length})
              </span>
            )}
          </h2>
          <Link href="/characters/new"
            className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
            style={{ background: "var(--accent)", color: "var(--background)" }}>
            + Nouveau personnage
          </Link>
        </div>

        {/* Character list or empty state */}
        {characters.length === 0 ? (
          <div className="rounded-2xl border p-10 text-center"
            style={{ background: "var(--muted)", borderColor: "var(--border)" }}>
            <div className="text-4xl mb-4">🧙</div>
            <p className="text-sm mb-6" style={{ color: "var(--foreground)", opacity: 0.5 }}>
              Tu n&apos;as pas encore de personnage.
            </p>
            <Link href="/characters/new"
              className="inline-flex px-5 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
              style={{ background: "var(--accent)", color: "var(--background)" }}>
              + Créer mon premier personnage
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {characters.map((char) => {
              const cls = OSE_CLASSES.find((c) => c.id === char.classId);
              return (
                <Link key={char.id} href={`/characters/${char.id}`}
                  className="rounded-xl border p-5 flex items-center justify-between transition-opacity hover:opacity-80"
                  style={{ background: "var(--muted)", borderColor: "var(--border)" }}>
                  <div>
                    <div className="font-bold" style={{ color: "var(--accent)" }}>{char.name}</div>
                    <div className="text-sm mt-0.5" style={{ color: "var(--foreground)", opacity: 0.5 }}>
                      {cls?.name ?? char.classId} · Niv. {char.level} · {ALIGNMENT_LABELS[char.alignment] ?? char.alignment}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm shrink-0 ml-4">
                    <div className="text-center">
                      <div style={{ color: "var(--foreground)", opacity: 0.4, fontSize: "0.65rem" }}>PV</div>
                      <div className="font-bold" style={{ color: "var(--foreground)" }}>
                        {char.currentHp}/{char.maxHp}
                      </div>
                    </div>
                    <div className="text-center">
                      <div style={{ color: "var(--foreground)", opacity: 0.4, fontSize: "0.65rem" }}>CA</div>
                      <div className="font-bold" style={{ color: "var(--foreground)" }}>{char.armorClass}</div>
                    </div>
                    <span style={{ color: "var(--foreground)", opacity: 0.3 }}>→</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
