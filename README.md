# TRACE

TRACE is HIMARK's internal audit and diagnostic system, powered by Atlas. It is built with TypeScript, React, the Next.js App Router, Tailwind CSS, and Motion.

## Commands

- `pnpm dev` — run the local application
- `pnpm typecheck` — validate TypeScript contracts
- `pnpm lint` — run the Next.js ESLint rules
- `pnpm build` — create a production build

## Architecture

- `app/` contains routes, layouts, and page composition.
- `components/` contains reusable UI and feature presentation.
- `modules/` contains TRACE domain services and repository ports.
- `atlas/` is the only TRACE-to-Atlas integration boundary.
- `lib/` contains shared technical infrastructure.
- `types/` contains shared domain contracts.
- `config/` centralises navigation, roles, Audit Types, and TRACE metadata.
- `data/mock/` contains current typed-transition mock datasets.

An Audit is a durable lineage. A baseline or reassessment is an Assessment within that lineage.
