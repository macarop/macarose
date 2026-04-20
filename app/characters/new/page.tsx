import Link from "next/link";

export default function NewCharacterPage() {
  return (
    <main
      className="min-h-screen px-4 py-12"
      style={{ background: "var(--background)" }}
    >
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-10">
          <Link
            href="/characters"
            className="text-sm transition-opacity hover:opacity-70"
            style={{ color: "var(--foreground)", opacity: 0.5 }}
          >
            ← Mes personnages
          </Link>
        </div>

        <div
          className="rounded-2xl border p-10 text-center"
          style={{ background: "var(--muted)", borderColor: "var(--border)" }}
        >
          <div className="text-4xl mb-4">⚒️</div>
          <h1 className="text-xl font-semibold mb-2" style={{ color: "var(--foreground)" }}>
            Créer un personnage
          </h1>
          <p className="text-sm" style={{ color: "var(--foreground)", opacity: 0.5 }}>
            Le wizard de création arrive bientôt.
          </p>
        </div>
      </div>
    </main>
  );
}
