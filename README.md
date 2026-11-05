# TRACE

TRACE is HIMARK's internal audit and diagnostic system, powered by Atlas. It is built with TypeScript, React, the Next.js App Router, Tailwind CSS, and Motion.

## Commands

- `pnpm dev` — run the local application
- `pnpm typecheck` — validate TypeScript contracts
- `pnpm test` — run the unit tests (see `tests/README.md`)
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

## Process flows

The Workflow tab of an Operational Flow Audit holds a BPMN 2.0 process-flow builder. This milestone is UI/UX only: all state is client-side mock state and there is no backend.

**Lifecycle.** Each model moves Draft → In Review → Awaiting Client → Approved, and an Approved model is locked. The As-Is is mapped first. When it is approved, a To-Be is created automatically from it. The two approvals (HIMARK, then client) are recorded by the Audit Lead (and Admin, who holds every permission) with an Approve button; the client approval happens outside the system, so there is no client sign-in. Only roles with the `processflow:approve` permission see the control.

**Tabs.** As-Is, To-Be, Compare (gaps and metrics between the two) and Improvements (rule-based and demo "AI" suggestions that a person accepts or rejects).

**Where things live.**

- `modules/process-flows/` — pure domain logic (lifecycle, workspace state, diff, compare model, metrics, validation, rules, suggestion state)
- `lib/bpmn/` — the process graph model and the compare XML builder; `lib/bpmn/editor/` — the diagram editor
- `components/process-flows/` — workspace UI; `hooks/use-process-flow.ts` — client state
- `data/mock/process-flows.ts` and `data/mock/process-flow-seed.ts` — mock user, demo suggestions and the seeded Purchase-to-Pay flow
- `types/process-flow.ts` — domain types

**Improvement rules.** Rules are in `modules/process-flows/rules.ts`. Each is a `ProcessRule` (`id`, `title`, `evaluate`) returning suggestion drafts. To add one, append it to `PROCESS_RULES` and add a test in `tests/process-rules.test.ts`. The thresholds `WAIT_THRESHOLD_MINUTES` and `MAX_HANDOFFS` are placeholders; the rules are to be specified by HIMARK process engineers.

**BPMN elements supported today (Stage 1).** Start and end events, task, user task, manual task, service task, exclusive gateway, pool, lane, sequence flow and message flow (see `lib/bpmn/editor/element-kinds.ts` and `palette.ts`). The rest of BPMN 2.0 is not implemented yet (Plans 2 and 3): other gateways and events, sub-processes, call activities, loops, data objects and stores, annotations, groups, transactions, conversation and choreography.

**Licensing.** The editor is built on the MIT-licensed `bpmn-moddle` and `diagram-js`. `bpmn-js` is deliberately not used because it forces a visible bpmn.io watermark, and no code is copied from it.

**Mock or limited in this milestone.**

- No persistence: state resets on refresh.
- No real AI call: "AI" suggestions are labelled demo data.
- No report gate: `reportBlockers` exists in the lifecycle module but nothing in the UI uses it.
- No reassessment start from a previous To-Be in the UI.

**Development role switch.** `?as=<Role>` on the workflow page URL (Admin, Audit Lead, Auditor, Reviewer, Viewer) previews permission gating. It is read only when `NODE_ENV` is not `production` and shows a "development only" badge.

Design: `docs/superpowers/specs/2026-11-05-bpmn-process-flow-builder-design.md`. Plan: `docs/superpowers/plans/2026-11-05-bpmn-process-flow-builder.md`.
