# BPMN Process Flow Builder (Operational Flow Audit) — Design

Status: **Draft for approval.** Nothing has been built. Date: 2026-11-05.

## 1. Intent

In an Operational Flow Audit, an auditor sits with a client and maps how a process works today (**As-Is**), then maps how the client wants it to work (**To-Be**). TRACE then shows the gaps between the two and recommends how to close them.

Today the Workflow tab (`components/workflows/workflow-canvas.tsx`) is a single left-to-right row of steps with arrows. It cannot express branching, decisions, loops, lanes or hand-offs, its zoom/undo/redo/search controls are inert, and its data is mock state lost on refresh. Operations work needs a real process modeller.

The goal is a **full BPMN 2.0 editor** that is easy enough that users are impressed by how friendly it is, wrapped in an approval lifecycle that guarantees every As-Is has a To-Be, with gaps made obvious and improvements recommended.

## 2. Goals

1. Full BPMN 2.0 notation. Nothing in the standard is unavailable (pools, lanes, all event types incl. boundary events, tasks of every type, sub-processes, call activities, loops/multi-instance, all gateways, sequence/message flows, data objects/stores, annotations, groups).
2. Import/export of standard BPMN 2.0 XML.
3. Very easy to use despite that breadth (see §5).
4. Every element carries TRACE audit data (owner, system, input, output, work time, wait time, approval flag, control, pain point, evidence links).
5. Every As-Is process flow must have a To-Be; the user is prompted to create it as soon as the As-Is is approved.
6. Gaps between As-Is and To-Be are obvious at a glance and as a list.
7. TRACE recommends improvements and implementation order; humans stay in control of what is accepted.

## 3. Non-goals / anti-goals

- Not a BPMN execution engine. We model and analyse; we do not run processes.
- Not a rebuild of the notation from scratch.
- Anti-goal: the editor exposing 100+ element types up front so that new users feel lost, even though it is technically complete.
- Anti-goal: AI output reaching a client or a report without HIMARK human approval.

## 4. Decisions made by the product owner

- Build on an established open-source BPMN editor library rather than from scratch, so the notation is correct.
- Support the full BPMN 2.0 standard.
- Process lifecycle with mandatory To-Be:
  `As-Is Draft → As-Is In Review → As-Is Approved (locked baseline) → To-Be Draft → To-Be In Review → To-Be Approved (locked) → Gaps & Recommendations`.
- On As-Is approval the user is immediately prompted/led into creating the To-Be.
- Approvals: HIMARK internal approval first, **final approval by the client**. Both happen **outside the system** (the client reviews on an online call). TRACE does not give clients a sign-in; it provides an **"Approved" button** that an authorised HIMARK user uses to record each approval.
- Improvement rules are owned and written by HIMARK's **process engineers**.
- **Reassessments always start from the previous approved To-Be** (it becomes the new As-Is).
- Improvement intelligence is a **mix of HIMARK-written rules and AI**. Working model: **human drafts → AI reviews and identifies gaps → HIMARK human approves → client gives final approval.**

## 5. Usability principles (design intent; details left to the builder)

Product owner's bar: users should be wowed by how intuitive it is. Proposed approach (my call):

- **Progressive disclosure.** Start with a small set (start, task, decision, end). The full BPMN palette is always reachable (search, "more" group, contextual suggestions) but not in the way.
- **Contextual quick-add.** Selecting an element offers the sensible next elements; drag from an element to extend the flow.
- **Plain-language names** alongside BPMN names (e.g. "Decision" with "Exclusive gateway" shown secondarily).
- **Live validation in plain English** (e.g. "this decision has only one outgoing path"), never blocking free-form drawing.
- Working undo/redo, zoom, fit-to-screen, search, keyboard shortcuts, auto-layout, snap/align.
- A guided empty state with a starter template (e.g. Purchase-to-Pay).
- Acceptance bar: a first-time auditor can draw a 10-step process with a decision in a few minutes without help (to be tested with real users; `docs/usability-testing.md` already exists).

## 6. Editor

- **Constraint (product owner, 2026-11-05): free/open-source only, no visible third-party logo.** This rules out bpmn-js (watermark) and the paid JointJS+/GoJS.
- **Free path found (to be confirmed):** `bpmn-moddle` (MIT; the BPMN 2.0 meta-model with validated XML read/write) plus `diagram-js` (MIT; the generic canvas/interaction framework bpmn-js is built on, per bpmn.io forum guidance that it can be used without restriction provided substantial parts of bpmn-js are not reused). The BPMN-specific drawing, palette, element behaviours, and the friendly UX would be built by us on top. This is a larger build than adopting bpmn-js and must not copy bpmn-js code.
- **Alternative (not in our control):** ask Camunda in writing whether a watermark-free bpmn-js arrangement exists. Forum posts say it may be available with a Camunda enterprise subscription, but availability is unclear.
- **DECISION (product owner, 2026-11-05): take the free route** (`bpmn-moddle` + `diagram-js`, our own BPMN editing layer). Staged delivery: basics (start/end events, tasks, exclusive gateway, flows, pools/lanes), then other gateways, events and sub-processes, then the rarer elements until the full BPMN 2.0 set is covered. The builder must first confirm the MIT licences of both packages from their licence files, and must not copy bpmn-js code. Optionally, HIMARK may separately ask Camunda in writing about a watermark-free bpmn-js arrangement; the build does not depend on it.
- **Requirements the library choice must meet:** full BPMN 2.0, BPMN 2.0 XML import/export, custom properties per element, no third-party watermark, React/Next.js compatible.
- **Licence (verified 2026-11-05 against bpmn.io/license and the bpmn-js LICENSE file):** free to use, modify and sell, including commercially. The one condition is that the code that shows the bpmn.io watermark "MUST NOT be removed or changed" and the watermark must stay fully visible and not overlapped by other elements. The pages do not mention a paid option for removing it. **Decision (product owner, 2026-11-05): a visible bpmn.io watermark is not acceptable, so bpmn-js is ruled out under its free licence.** The library choice is therefore **open**. Candidates found in a first search (vendor claims, not independently verified): JointJS+ (commercial, per-developer perpetual licence, markets BPMN 2.0 shapes and XML import/export without third-party attribution; listed around US$3,000–3,500 per developer) and GoJS (commercial, around US$3,500, BPMN sample). Before choosing, the builder must verify with a prototype or vendor that the candidate covers the *entire* BPMN 2.0 element set and round-trips valid BPMN XML, because "nothing should be missing" is a hard requirement.
- Audit fields are stored on elements as BPMN extension elements (a TRACE namespace) so exported XML stays valid and round-trips.
- Rendered inside the existing dashboard shell on the audit's Workflow tab, following the app's design tokens, light/dark themes and existing UI primitives (`components/ui/*`).
- Next.js note: this project uses a Next.js version with breaking changes (`AGENTS.md`); the builder must read the relevant docs in `node_modules/next/dist/docs/` before writing route/client-component code. The editor is browser-only and must be loaded client-side.

## 7. Lifecycle and approvals

- A **Process Flow** belongs to an Audit's assessment (the README states an Audit is a durable lineage; baseline and reassessments are Assessments in it). Each Process Flow has an **As-Is model** and a **To-Be model**, each with its own status.
- Stage statuses: Draft → In Review → Approved (locked). Rejection at any approval step returns the stage to Draft with reviewer comments retained.
- Approval order per stage: **(1) senior HIMARK approval, (2) client final approval.** Both are given outside TRACE (internally, and on an online call with the client). A stage is locked only after the client's approval has been recorded.
- **In-system mechanism:** an **Approve** action (button) for each of the two approvals. Recording an approval captures who clicked it, when, which approval it is (HIMARK or client), and an optional note (e.g. "approved on call, 12 Nov"). (My call: the user who may click it needs a permission; reuse `assessment:approve` for the HIMARK approval and `assessment:signoff` for the client's approval. Product owner decided: only the **Audit Lead** clicks Approve; both permissions are already held by the Audit Lead role in `config/roles.ts`.)
- A **Reject / request changes** action returns the stage to Draft, with a comment.
- **Auto-start of To-Be:** when the As-Is is fully approved, TRACE creates the To-Be as a copy of the As-Is (element identities preserved) and takes the user into it.
- **Gate:** a report cannot be issued while any Process Flow lacks an approved To-Be.
- Locked models are never edited in place; changes require a new version. Every version records who approved what, and when.
- Reuses existing concepts: assessment statuses (`Under Review`, `Changes Requested`, `Approved`, `Signed Off`), permissions (`assessment:review`, `assessment:approve`, `assessment:signoff`) and roles in `config/roles.ts`. The role set currently has no **client** role.
- **No client sign-in and no new client role.** Clients never log in to TRACE for this feature; HIMARK staff record the approvals (decided by the product owner).
- **Reassessments:** a new reassessment's As-Is is created from the previous assessment's approved To-Be (element identities preserved, new version lineage), then goes through the same lifecycle.

## 8. Gap analysis

- Because the To-Be starts as a copy of the As-Is, elements are matched by identity, not guessed.
- **Classification:** removed, added, changed (type, lane/owner, system, timings, control), unchanged.
- **Compare view:** one canvas, colour-coded (red removed, green added, amber changed, grey unchanged), plus a gap list. Clicking a gap list item selects the element on the canvas.
- **Headline metrics:** number of steps, manual steps, hand-offs, approvals, total work time, total waiting time, As-Is → To-Be.
- **Pain-point coverage:** each As-Is pain point is shown as addressed or "not addressed by the To-Be".
- Elements the user adds from scratch to the To-Be (no As-Is match) count as added; steps deleted count as removed. If the user wants to re-link, the builder offers a manual "this replaces that" action. (My call.)

## 9. Improvement recommendations

- **Hybrid engine.** (a) HIMARK-authored rules, written and maintained by HIMARK's process engineers (e.g. manual re-keying between systems, waiting time above a threshold, duplicate approvals, missing control on a payment step, excessive hand-offs). (b) AI reviews the As-Is and To-Be, identifies gaps the rules miss and proposes recommendations and an implementation order with reasoning.
- **AI is advisory.** Every AI output is a suggestion with a visible source (rule or AI). A HIMARK reviewer accepts, edits or rejects each one before it can be shown to the client or placed in a report. Accepted items convert into the existing Finding / Recommendation records (`types/finding.ts`, `types/recommendation.ts`) with priority, effort and dependencies.
- **Implementation order** is based on dependencies, effort and expected impact on the headline metrics.
- **AI access (my call):** AI calls go through the existing Atlas integration boundary (`atlas/`), not directly from components, per the README ("`atlas/` is the only TRACE-to-Atlas integration boundary"). Which model/provider Atlas uses is out of scope here.

## 10. Data and persistence

- Currently all TRACE data is typed mock data (`data/mock/`) behind repository ports in `modules/`. This feature follows the same pattern: a Process Flow repository port with a mock-backed implementation first, so a real backend can be swapped in without changing the UI.
- Persist: BPMN XML per model version, audit fields per element, approval records, AI/rule suggestions and their decisions.
- The existing `WorkflowStep` type (`types/workflow.ts`) and `WorkflowStepMock` are superseded by the BPMN element model; the old canvas is replaced, not kept alongside.
- Which audit types get this: **Operational Flow Audit only** (it is the only type with the `workflow-capture` capability). The `workflow-capture` capability and the `Workflow` supported tab remain the hook.

## 11. Constraints

- Follow repo conventions (`pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` must pass).
- Respect permissions and role boundaries; no unrelated client data touched.
- Mockups from brainstorming (BPMN builder layout, lifecycle strip, compare view) are illustrative only and use made-up numbers.

## 12. Left to the builder

- Exact UI layout, visual styling, component breakdown and file structure.
- The precise rule catalogue and thresholds (to be reviewed with HIMARK operations experts).
- Starter templates, keyboard shortcut set, auto-layout approach.
- Test strategy (unit tests for diff and rules; end-to-end for the lifecycle).

## 13. Open questions for the product owner

Answered by the product owner: client sign-in (none), senior approver (outside the system, with an Approve button), rule ownership (process engineers), reassessments (start from the previous approved To-Be).

Also answered: **the Audit Lead clicks Approve** (for both the HIMARK and the client approval). **The bpmn.io watermark is not acceptable**, so bpmn-js is ruled out under its free licence (see §6).

Still open:
1. Do the process engineers need a screen in TRACE to write and edit rules, or is the first version a developer-maintained rules file that they specify? (My suggestion: rules file first, rules screen later.)
