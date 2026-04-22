import Link from "next/link";
import CharacterWizard from "./CharacterWizard";

export default function NewCharacterPage() {
  return (
    <main className="min-h-screen px-4 py-10" style={{ background: "var(--background)" }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/characters"
            className="text-sm transition-opacity hover:opacity-100"
            style={{ color: "var(--foreground)", opacity: 0.4 }}>
            ← Mes personnages
          </Link>
          <h1 className="text-2xl font-bold mt-3" style={{ color: "var(--accent)" }}>
            Créer un personnage
          </h1>
        </div>
        <CharacterWizard />
      </div>
    </main>
  );
}
