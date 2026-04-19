# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

OSE App — a web application for playing **Old-School Essentials (OSE)** tabletop RPG. Phase 1 is character sheet management; later phases add combat management and a GM map mode.

## Stack

- **Framework**: Next.js 14 App Router, TypeScript strict (`strict: true`, `noUncheckedIndexedAccess: true`)
- **UI**: Tailwind CSS + shadcn/ui + Radix UI, dark theme by default
- **Auth**: Auth.js v5 (NextAuth) — Google OAuth only
- **Database**: Vercel Postgres via Prisma ORM
- **Validation**: Zod (forms + API route handlers)
- **Tests**: Vitest (unit) + Playwright (e2e)
- **CI/CD**: GitHub Actions + auto Vercel deploy on PR/main

## Commands

```bash
npm run dev          # start dev server
npm run build        # production build
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run test         # Vitest unit tests
npm run test:e2e     # Playwright e2e tests
npx prisma migrate dev   # run DB migrations locally
npx prisma studio        # browse DB
npx prisma db seed       # run prisma/seed.ts
```

Run a single Vitest test: `npm run test -- path/to/file.test.ts`  
Run a single Playwright test: `npx playwright test path/to/file.spec.ts`

## Architecture

```
/app              → Next.js routes + React Server Components
/app/api          → Route Handlers (API layer only)
/app/(auth)       → login/logout pages
/app/characters   → character list + wizard + sheet pages
/data/ose         → OSE SRD rules as JSON (classes, races, spells, items, monsters)
/lib/domain       → pure business logic (no Next.js deps) — rules.ts, catalog.ts, types.ts
/prisma           → schema.prisma + migrations + seed.ts
/components       → shared React components
```

**Key architectural rule**: route handlers in `/app/api` only validate (Zod) → call domain logic → return JSON. All game rules live in `/lib/domain`, which is pure TypeScript with no framework dependencies. This makes `/lib/domain` extractable to a separate backend later.

## Domain logic conventions

- `computeDerivedStats(character)` in `/lib/domain/rules.ts` is the authoritative source for HP, AC, saves, to-hit — always recalculate server-side, never trust client payload.
- Dice rolls that affect character creation happen server-side (route handlers), not client-side.
- OSE class/spell/item lookups go through `getClass(id)`, `getSpell(id)` etc. in `/lib/domain/catalog.ts`, which validate with Zod at load time.

## Data model notes

- `Character.classId` and `Character.raceId` are string refs to `/data/ose` JSON — not FK to a DB table.
- `Character.inventory` and `Character.spells` are stored as JSON columns (flexible, not normalized).
- Soft-delete (archive) pattern is used for characters, not hard delete.

## OSE / OGL compliance

- Only OSE SRD content may be embedded: the 7 base classes, XP/saves/to-hit tables, SRD spells, SRD monsters, equipment lists.
- The OGL 1.0a full text + Section 15 attribution must be present in the `/about` page and app footer.
- Do not include OSE flavor text, lore, or artwork — mechanics only.

## Environment variables

Document all required vars in `.env.example`. Key vars:
- `DATABASE_URL` — Vercel Postgres connection string
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth
- `NEXTAUTH_SECRET` — Auth.js secret
- `NEXTAUTH_URL` — canonical app URL
