import { auth, signOut } from "@/auth";

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
                className="text-sm px-3 py-1.5 rounded-lg border transition-opacity hover:opacity-70"
                style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
              >
                Déconnexion
              </button>
            </form>
          </div>
        </div>

        {/* Contenu statique */}
        <div
          className="rounded-2xl border p-10 text-center"
          style={{ background: "var(--muted)", borderColor: "var(--border)" }}
        >
          <div className="text-4xl mb-4">🧙</div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--foreground)" }}>
            Mes personnages
          </h2>
          <p className="text-sm" style={{ color: "var(--foreground)", opacity: 0.5 }}>
            La création de personnages arrive bientôt.
          </p>
        </div>
      </div>
    </main>
  );
}
