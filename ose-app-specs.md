# Spécifications — Application OSE (Old-School Essentials)

> Document de cadrage + liste d'issues prêtes à importer dans GitHub Projects.

---

## 1. Vision produit

Une application web pour jouer à **Old-School Essentials (OSE)**, construite en trois phases :

1. **Phase 1 — MVP** : création et gestion de fiches de personnages en ligne.
2. **Phase 2** : gestionnaire de combats (initiative, tour par tour, HP, jets).
3. **Phase 3** : mode Maître de Jeu avec carte en vue du dessus et scénarios simples.

**Utilisateurs cibles**
- Joueurs OSE qui veulent une fiche numérique à la place du papier.
- MJ qui veulent piloter un combat ou un scénario sans sortir 40 tables imprimées.

**Objectifs non-fonctionnels**
- Hébergement : **Vercel** (front + API + BDD).
- Authentification : **Google OAuth uniquement** pour la phase 1.
- Mobile-first : la fiche doit être lisible sur téléphone.

---

## 2. Architecture

```
┌─────────────────────────────────────────────┐
│   Next.js 14 (App Router) — déployé Vercel  │
│                                             │
│  /app            → Front React (RSC)        │
│  /app/api        → Route Handlers (API)     │
│  /data/ose       → Règles OSE (JSON/TS)     │
│  /lib            → Domaine métier (règles)  │
│  /prisma         → Schéma BDD + migrations  │
└──────────────┬──────────────────────────────┘
               │
               ▼
    ┌──────────────────────┐
    │  Vercel Postgres     │
    │  (users, characters, │
    │   campaigns)         │
    └──────────────────────┘
```

**Stack**
- **Framework** : Next.js 14 (App Router, Server Components)
- **Langage** : TypeScript strict
- **UI** : Tailwind CSS + shadcn/ui + Radix UI
- **Auth** : NextAuth.js (Auth.js v5) — provider Google
- **BDD** : Vercel Postgres
- **ORM** : Prisma
- **Validation** : Zod (formulaires + API)
- **Tests** : Vitest (unit) + Playwright (e2e)
- **CI/CD** : GitHub Actions + déploiement Vercel auto sur PR/main

**Séparation front/back dans un monorepo Next.js**
- Le front reste strictement dans `/app` et consomme les endpoints via `fetch('/api/...')`.
- La logique métier vit dans `/lib/domain` (pure, testable, sans dépendance Next).
- Les route handlers `/app/api/*` ne font que : valider (Zod) → appeler le domaine → retourner JSON.
- Cela permettra, plus tard, d'extraire `/lib/domain` + `/app/api` vers un back séparé si besoin.

---

## 3. Modèle de données (premier jet)

```prisma
model User {
  id            String      @id @default(cuid())
  email         String      @unique
  name          String?
  image         String?
  createdAt     DateTime    @default(now())
  characters    Character[]
  accounts      Account[]   // NextAuth
  sessions      Session[]   // NextAuth
}

model Character {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  name          String
  classId       String   // ref vers /data/ose/classes
  raceId        String?  // ref vers /data/ose/races
  level         Int      @default(1)
  xp            Int      @default(0)
  alignment     String

  // Caractéristiques (OSE : STR, INT, WIS, DEX, CON, CHA)
  str           Int
  int           Int
  wis           Int
  dex           Int
  con           Int
  cha           Int

  // Dérivés
  maxHp         Int
  currentHp     Int
  armorClass    Int

  // Inventaire et sorts stockés en JSON (flexibles)
  inventory     Json     // [{ itemId, quantity, equipped }]
  spells        Json?    // { prepared: [...], known: [...] }
  notes         String?

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

---

## 4. Règles OSE et licence

OSE est publié par Necrotic Gnome. Le **OSE SRD** (System Reference Document) est distribué sous **Open Game License (OGL) 1.0a**. On peut embarquer :
- les classes (Cleric, Fighter, Magic-User, Thief, Dwarf, Elf, Halfling)
- les tables de progression (XP, saves, to-hit)
- les sorts du SRD
- les monstres du SRD

**Obligation** : inclure la mention OGL dans l'application (page "À propos" ou footer) + respecter Section 15 de la OGL (liste des produits source).

On NE PEUT PAS réutiliser les textes d'ambiance ou illustrations du livre OSE — seulement les mécaniques.

---

## 5. Organisation GitHub Project

**Milestones**
- `M1 — Fondations` : setup technique, auth, BDD, CI/CD.
- `M2 — Création de personnage` : wizard, génération de stats, sauvegarde.
- `M3 — Fiche de personnage` : affichage, édition, montée de niveau.
- `M4 — Backlog post-MVP` : combat, MJ, carte, multijoueur.

**Labels suggérés**
- Type : `type:setup`, `type:feature`, `type:bug`, `type:docs`, `type:chore`
- Zone : `area:frontend`, `area:backend`, `area:auth`, `area:data`, `area:ui`, `area:devops`
- Priorité : `priority:high`, `priority:medium`, `priority:low`

---

## 6. Issues prêtes à importer

> Copier-coller chaque bloc comme issue, ou utiliser le script `gh` en annexe. Les titres sont volontairement courts (≤ 70 caractères).

---

### ISSUE-01 — Initialiser le projet Next.js 14 + TypeScript strict
**Labels :** `type:setup`, `area:devops`, `priority:high`
**Milestone :** M1 — Fondations

Créer le squelette du projet.

**Acceptance criteria**
- [ ] `npx create-next-app@latest` avec App Router, TypeScript, Tailwind, ESLint
- [ ] `tsconfig.json` en mode `strict: true` + `noUncheckedIndexedAccess: true`
- [ ] Prettier configuré + `eslint-config-prettier`
- [ ] Convention de commits (ex. Conventional Commits) documentée dans `CONTRIBUTING.md`
- [ ] `README.md` avec instructions de run local

---

### ISSUE-02 — Configurer le déploiement Vercel et les environnements
**Labels :** `type:setup`, `area:devops`, `priority:high`
**Milestone :** M1 — Fondations

**Acceptance criteria**
- [ ] Projet Vercel connecté au repo GitHub
- [ ] Environnements `preview` (PR) et `production` (main) actifs
- [ ] Variables d'environnement documentées dans `.env.example`
- [ ] Workflow GitHub Actions : lint + typecheck + tests sur PR
- [ ] Badge de build dans le README

---

### ISSUE-03 — Configurer Vercel Postgres + Prisma
**Labels :** `type:setup`, `area:backend`, `area:data`, `priority:high`
**Milestone :** M1 — Fondations

**Acceptance criteria**
- [ ] Base Vercel Postgres provisionnée (dev + prod)
- [ ] Prisma installé, schéma initial `User` + tables NextAuth
- [ ] Script `prisma migrate dev` fonctionnel en local
- [ ] Script de seed minimal (`prisma/seed.ts`)
- [ ] Documenter dans README comment reset la base locale

---

### ISSUE-04 — Authentification Google via NextAuth (Auth.js v5)
**Labels :** `type:feature`, `area:auth`, `priority:high`
**Milestone :** M1 — Fondations

**Acceptance criteria**
- [ ] Google OAuth configuré (clés dans Vercel env)
- [ ] Adapter Prisma branché → sessions en BDD
- [ ] Page `/login` avec bouton "Se connecter avec Google"
- [ ] Page `/logout` fonctionnelle
- [ ] Middleware qui protège les routes `/app/characters/*`
- [ ] Récupération de `session.user` dans les Server Components + Route Handlers

---

### ISSUE-05 — Charte graphique et composants UI de base
**Labels :** `type:feature`, `area:ui`, `priority:medium`
**Milestone :** M1 — Fondations

**Acceptance criteria**
- [ ] shadcn/ui installé, composants de base ajoutés (Button, Input, Card, Dialog, Select)
- [ ] Palette + typographie définies dans `tailwind.config.ts`
- [ ] Layout racine avec header (logo + user menu) + footer (mentions OGL)
- [ ] Thème sombre par défaut (ambiance médiévale-fantastique)
- [ ] Composant `PageTitle` réutilisable

---

### ISSUE-06 — Structurer le catalogue de règles OSE (types TS)
**Labels :** `type:feature`, `area:data`, `priority:high`
**Milestone :** M1 — Fondations

Définir les types TypeScript qui modélisent les règles OSE, et l'arborescence `/data/ose`.

**Acceptance criteria**
- [ ] Types `Class`, `Race`, `Spell`, `Item`, `Monster` dans `/lib/domain/types.ts`
- [ ] Arborescence `/data/ose/{classes,races,spells,items,monsters}.json`
- [ ] Fonction `getClass(id)` / `getSpell(id)` etc. dans `/lib/domain/catalog.ts`
- [ ] Validation Zod au chargement (détecter les erreurs de format au build)
- [ ] Tests unitaires sur les helpers de catalogue

---

### ISSUE-07 — Intégrer les classes OSE du SRD
**Labels :** `type:feature`, `area:data`, `priority:high`
**Milestone :** M1 — Fondations

**Acceptance criteria**
- [ ] JSON pour les 7 classes : Cleric, Fighter, Magic-User, Thief, Dwarf, Elf, Halfling
- [ ] Chaque classe a : prérequis, HD, tables XP, saves, to-hit par niveau (1 à 14)
- [ ] Sources citées (OSE SRD) dans les commentaires
- [ ] Mention OGL ajoutée au footer de l'app

---

### ISSUE-08 — Intégrer les sorts OSE du SRD (niveaux 1 à 6)
**Labels :** `type:feature`, `area:data`, `priority:medium`
**Milestone :** M1 — Fondations

**Acceptance criteria**
- [ ] Sorts arcanes (Magic-User) niveaux 1 à 6 du SRD
- [ ] Sorts divins (Cleric) niveaux 1 à 5 du SRD
- [ ] Champs : nom, niveau, portée, durée, description, composantes
- [ ] Tests de cohérence (tous les sorts référencés par les classes existent)

---

### ISSUE-09 — Intégrer l'équipement de base OSE
**Labels :** `type:feature`, `area:data`, `priority:medium`
**Milestone :** M1 — Fondations

**Acceptance criteria**
- [ ] Armes de mêlée, armes à distance, armures, boucliers
- [ ] Équipement d'aventurier (torches, corde, rations, etc.)
- [ ] Champs : coût (po/pa/pc), encombrement, dégâts (si arme), AC (si armure)
- [ ] Kits de départ par classe (référencés par `classId`)

---

### ISSUE-10 — Wizard de création de personnage — étape 1 : caractéristiques
**Labels :** `type:feature`, `area:frontend`, `priority:high`
**Milestone :** M2 — Création de personnage

**Acceptance criteria**
- [ ] Page `/characters/new` protégée par auth
- [ ] Choix de méthode : 3d6 dans l'ordre (défaut OSE) / 3d6 arrangeable / 4d6 drop lowest (option)
- [ ] Jet de dés côté serveur (pas côté client, pour éviter les triches évidentes)
- [ ] Affichage des 6 caractéristiques + modifiers OSE
- [ ] Bouton "Relancer" (avant validation de l'étape)

---

### ISSUE-11 — Wizard étape 2 : choix de classe + race
**Labels :** `type:feature`, `area:frontend`, `priority:high`
**Milestone :** M2 — Création de personnage

**Acceptance criteria**
- [ ] Liste des classes avec prérequis (ex. Magic-User demande INT ≥ 9)
- [ ] Classes non éligibles grisées avec explication
- [ ] Les 3 classes de demi-humains (Dwarf, Elf, Halfling) apparaissent si prérequis respectés
- [ ] Aperçu latéral : HD, saves, to-hit, sorts de départ (si magie)
- [ ] Validation Zod côté API

---

### ISSUE-12 — Wizard étape 3 : calculs dérivés (HP, AC, saves)
**Labels :** `type:feature`, `area:backend`, `priority:high`
**Milestone :** M2 — Création de personnage

**Acceptance criteria**
- [ ] Fonction pure `computeDerivedStats(character)` dans `/lib/domain/rules.ts`
- [ ] HP : jet du HD de classe + modif CON (min 1)
- [ ] AC de base (9 en OSE) + modif DEX
- [ ] Saves lus depuis la table de classe au niveau 1
- [ ] Tests unitaires sur au moins 3 personnages de référence
- [ ] Affichage dans le wizard + possibilité de relancer les HP (une fois)

---

### ISSUE-13 — Wizard étape 4 : équipement de départ
**Labels :** `type:feature`, `area:frontend`, `priority:medium`
**Milestone :** M2 — Création de personnage

**Acceptance criteria**
- [ ] Option A : kit prédéfini (rapide)
- [ ] Option B : 3d6 × 10 po à dépenser soi-même
- [ ] Recherche/filtrage dans le catalogue d'équipement
- [ ] Calcul automatique du total dépensé + encombrement
- [ ] Validation : pas plus d'argent que dépensé

---

### ISSUE-14 — Wizard étape 5 : sorts initiaux (Magic-User / Elf)
**Labels :** `type:feature`, `area:frontend`, `priority:medium`
**Milestone :** M2 — Création de personnage

**Acceptance criteria**
- [ ] Étape n'apparaît que pour les classes magiques
- [ ] Choix du sort connu (1 au niveau 1 pour Magic-User)
- [ ] Read Magic offert automatiquement (règle OSE)
- [ ] Explications claires sur la mécanique "memoriser" d'OSE

---

### ISSUE-15 — Endpoint API POST /api/characters (création)
**Labels :** `type:feature`, `area:backend`, `priority:high`
**Milestone :** M2 — Création de personnage

**Acceptance criteria**
- [ ] Route handler `POST /app/api/characters/route.ts`
- [ ] Schéma Zod de validation du payload
- [ ] Recalcul côté serveur de tous les stats dérivés (pas de confiance au client)
- [ ] Insertion Prisma + retour 201 avec l'id
- [ ] Erreur 401 si non authentifié, 422 si payload invalide
- [ ] Tests e2e Playwright : création complète de bout en bout

---

### ISSUE-16 — Liste des personnages de l'utilisateur
**Labels :** `type:feature`, `area:frontend`, `priority:high`
**Milestone :** M3 — Fiche de personnage

**Acceptance criteria**
- [ ] Page `/characters` qui liste les persos du user connecté
- [ ] Carte par perso : nom, classe, niveau, HP courant/max
- [ ] Bouton "Nouveau personnage" → `/characters/new`
- [ ] État vide (aucun perso) avec illustration + CTA
- [ ] Tri : dernier modifié en premier

---

### ISSUE-17 — Fiche de personnage détaillée (lecture)
**Labels :** `type:feature`, `area:frontend`, `priority:high`
**Milestone :** M3 — Fiche de personnage

**Acceptance criteria**
- [ ] Page `/characters/[id]`
- [ ] Sections : identité, caractéristiques, combat (HP/AC/to-hit), saves, inventaire, sorts, notes
- [ ] Mobile-first : une colonne sur téléphone, deux sur desktop
- [ ] Bouton "Éditer" visible si user est propriétaire
- [ ] 404 si id inconnu, 403 si pas propriétaire

---

### ISSUE-18 — Édition de la fiche (HP, XP, inventaire, notes)
**Labels :** `type:feature`, `area:frontend`, `priority:high`
**Milestone :** M3 — Fiche de personnage

**Acceptance criteria**
- [ ] Édition inline des HP courants (sur le clic + boutons +/-)
- [ ] Édition des XP avec détection du franchissement de niveau (toast "Niveau supérieur disponible")
- [ ] Ajout/retrait d'items dans l'inventaire
- [ ] Édition des notes (textarea markdown simple)
- [ ] Endpoint `PATCH /api/characters/[id]` avec validation Zod

---

### ISSUE-19 — Montée de niveau
**Labels :** `type:feature`, `area:backend`, `area:frontend`, `priority:medium`
**Milestone :** M3 — Fiche de personnage

**Acceptance criteria**
- [ ] Action "Passer au niveau N+1" quand XP suffisants
- [ ] Jet de HD additionnel (serveur)
- [ ] Mise à jour des saves et to-hit selon table de classe
- [ ] Pour magiciens : nouveaux slots de sorts
- [ ] Historique des levels dans la fiche

---

### ISSUE-20 — Suppression / archivage de personnage
**Labels :** `type:feature`, `area:backend`, `area:frontend`, `priority:low`
**Milestone :** M3 — Fiche de personnage

**Acceptance criteria**
- [ ] Bouton "Archiver" (soft delete) sur la fiche
- [ ] Liste séparée des persos archivés
- [ ] Possibilité de restaurer
- [ ] Suppression définitive seulement depuis les archives (double confirmation)

---

### ISSUE-21 — Page "À propos" + mentions OGL
**Labels :** `type:docs`, `priority:medium`
**Milestone :** M3 — Fiche de personnage

**Acceptance criteria**
- [ ] Page `/about` avec description du projet
- [ ] Texte intégral de l'OGL 1.0a + Section 15 remplie
- [ ] Lien vers le SRD OSE officiel
- [ ] Mention "Cette application n'est pas affiliée à Necrotic Gnome"

---

### ISSUE-22 — Tests e2e Playwright — parcours critique
**Labels :** `type:chore`, `area:devops`, `priority:medium`
**Milestone :** M3 — Fiche de personnage

**Acceptance criteria**
- [ ] Scénario : login → création perso complète → édition → suppression
- [ ] Scénario : tentative d'accès sans auth → redirection login
- [ ] Scénario : tentative d'accès au perso d'un autre user → 403
- [ ] Tests exécutés en CI sur chaque PR

---

### ISSUE-23 — [BACKLOG] Gestionnaire de combat
**Labels :** `type:feature`, `priority:low`
**Milestone :** M4 — Backlog post-MVP

Piloter un combat OSE : initiative, tour par tour, HP, jets.

**Acceptance criteria (à affiner)**
- [ ] Créer une rencontre (liste de PJ + monstres)
- [ ] Jet d'initiative (individuel ou par camp, selon option)
- [ ] Tour actif visuellement mis en avant
- [ ] Jets de to-hit / dégâts intégrés
- [ ] Historique des actions du combat

---

### ISSUE-24 — [BACKLOG] Mode MJ : carte en vue du dessus
**Labels :** `type:feature`, `priority:low`
**Milestone :** M4 — Backlog post-MVP

**Acceptance criteria (à affiner)**
- [ ] Grille (carrée ou hex) configurable
- [ ] Import d'image de fond
- [ ] Jetons PJ/monstres déplaçables
- [ ] Brouillard de guerre (fog of war)
- [ ] Partage en lecture avec les joueurs

---

### ISSUE-25 — [BACKLOG] Multijoueur temps réel (MJ + joueurs)
**Labels :** `type:feature`, `priority:low`
**Milestone :** M4 — Backlog post-MVP

**Acceptance criteria (à affiner)**
- [ ] Notion de "campagne" regroupant MJ + joueurs
- [ ] Synchro temps réel (WebSocket via Pusher, Ably, ou partykit)
- [ ] Le MJ voit les fiches de tous les joueurs
- [ ] Les joueurs voient la carte partagée

---

## Annexe — Import automatisé via `gh` CLI

Pour importer les issues via script après avoir créé le repo :

```bash
# Installer : brew install gh && gh auth login
# Créer les milestones
gh api repos/:owner/:repo/milestones -f title="M1 — Fondations"
gh api repos/:owner/:repo/milestones -f title="M2 — Création de personnage"
gh api repos/:owner/:repo/milestones -f title="M3 — Fiche de personnage"
gh api repos/:owner/:repo/milestones -f title="M4 — Backlog post-MVP"

# Créer les labels
gh label create "type:setup" --color "0366d6"
gh label create "type:feature" --color "0e8a16"
gh label create "type:bug" --color "d73a4a"
gh label create "type:docs" --color "0075ca"
gh label create "type:chore" --color "cccccc"
gh label create "area:frontend" --color "fbca04"
gh label create "area:backend" --color "5319e7"
gh label create "area:auth" --color "b60205"
gh label create "area:data" --color "1d76db"
gh label create "area:ui" --color "c5def5"
gh label create "area:devops" --color "000000"
gh label create "priority:high" --color "b60205"
gh label create "priority:medium" --color "fbca04"
gh label create "priority:low" --color "cccccc"

# Exemple de création d'issue
gh issue create \
  --title "Initialiser le projet Next.js 14 + TypeScript strict" \
  --label "type:setup,area:devops,priority:high" \
  --milestone "M1 — Fondations" \
  --body-file issue-01.md
```

---

## Annexe — Questions ouvertes à trancher avant de coder

1. **OSE Classic ou OSE Advanced ?** Classic = B/X simple (7 classes). Advanced = AD&D-like (classes + races séparées). Cette spec suppose Classic — à confirmer.
2. **Multi-classage / classes avancées ?** Hors scope MVP, mais à valider.
3. **Encombrement (encumbrance)** : OSE a deux systèmes optionnels (simple vs détaillé). Lequel implémenter ?
4. **Personnages partagés** : un personnage peut-il être vu en lecture par d'autres users (URL publique) ? Utile pour un MJ qui regarde la fiche d'un joueur.
5. **Export PDF de la fiche** : demandé ou non ? (ajouterait une issue dédiée)
