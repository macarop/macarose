import { auth, signOut } from "@/auth";
import Link from "next/link";

export default async function CharactersPage() {
  const session = await auth();

  return (
    <main
      className="min-h-screen px-4 py-12"
      style={{ background: "var(--background)" }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-2xl font-bold" style={{ color: "var(--accent)" }}>
            ⚔️ OSE App
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm" style={{ color: "var(--foreground)", opacity: 0.6 }}>
              {session?.user?.email}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="text-sm px-3 py-1.5 rounded-lg border transition-opacity hover:opacity-70 cursor-pointer"
                style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
              >
                Déconnexion
              </button>
            </form>
          </div>
        </div>

        {/* Titre section + bouton nouveau */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
            Mes personnages
          </h2>
          <Link
            href="/characters/new"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
            style={{ background: "var(--accent)", color: "var(--background)" }}
          >
            + Nouveau personnage
          </Link>
        </div>

        {/* État vide */}
        <div
          className="rounded-2xl border p-10 text-center"
          style={{ background: "var(--muted)", borderColor: "var(--border)" }}
        >
          <div className="text-4xl mb-4">🧙</div>
          <p className="text-sm mb-6" style={{ color: "var(--foreground)", opacity: 0.5 }}>
            Tu n&apos;as pas encore de personnage.
          </p>
          <Link
            href="/characters/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
            style={{ background: "var(--accent)", color: "var(--background)" }}
          >
            + Créer mon premier personnage
          </Link>
        </div>
      </div>
    </main>
  );
}
