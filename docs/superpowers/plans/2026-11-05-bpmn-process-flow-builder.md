# BPMN Process Flow Builder — Plan 1 (Foundation + Editor Stage 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Operational Flow Audit's linear Workflow tab with a BPMN 2.0 process builder that has a mandatory As-Is → To-Be lifecycle, recorded HIMARK/client approvals, a gap view, and rule+AI improvement suggestions.

**Architecture:** Pure, unit-tested domain logic in `modules/process-flows/` (lifecycle, diff, metrics, validation, rules) over a normalised `ProcessGraph` derived from BPMN XML by `bpmn-moddle` (`lib/bpmn/`). The visual editor is built by us on `diagram-js` (`lib/bpmn/editor/`) and wrapped by React components in `components/process-flows/`. AI review goes only through `atlas/`. Persistence is a repository port with an in-memory mock, matching the repo's existing pattern.

**Tech Stack:** Next.js 16.3 (App Router), React 19, TypeScript 5.7, Tailwind 4, `bpmn-moddle` + `diagram-js` (both must be confirmed MIT), `node --test` with `--experimental-strip-types`.

**Spec:** `docs/superpowers/specs/2026-11-05-bpmn-process-flow-builder-design.md`

**Scope note (read first):** The spec asks for the *entire* BPMN 2.0 standard, delivered in stages. This plan delivers everything except editor breadth beyond **Stage 1** elements: `bpmn:StartEvent`, `bpmn:EndEvent`, `bpmn:Task`, `bpmn:UserTask`, `bpmn:ManualTask`, `bpmn:ServiceTask`, `bpmn:ExclusiveGateway`, `bpmn:SequenceFlow`, `bpmn:MessageFlow`, `bpmn:Participant` (pools), `bpmn:Lane`. **Plan 2** (Stage 2: parallel/inclusive/event-based/complex gateways, intermediate and boundary events, sub-processes, call activities, loop and multi-instance markers) and **Plan 3** (Stage 3: data objects/stores, annotations, groups, all event definitions, transactions, event sub-processes, compensation, conversation and choreography diagrams) are written after this plan ships. The `ProcessGraph` model, XML adapter and lifecycle are element-agnostic so those plans only extend the editor.

## Scope Amendment (product owner, 2026-11-05): UI/UX only, no backend

The product owner chose subagent-driven execution **for the UI/UX only, not the backend**. Resulting scope for this run:

- **Skipped entirely:** Task 6 (repository port, service, in-memory repository), Task 8 (Atlas adapter / AI call), Task 14 (report gate and reassessment start, which need the service), and any persistence or API.
- **Kept:** Tasks 1–5 (browser-side types, permission, lifecycle, metrics, diff, validation, rules — pure logic that the screens need to show anything), Task 7 (BPMN XML adapter, runs in the browser), Tasks 9–12 (editor), Task 13 (workspace UI), Task 15 (docs).
- **Task 13 replacement for the service:** `hooks/use-process-flow.ts` holds all state **client-side in React state seeded from mock data** (`data/mock/process-flows.ts`, a plain data file — no repository). Lifecycle transitions call `lifecycle.ts` directly; the Approve buttons are gated with `usePermissions(role).can('processflow:approve')`; approval history is a local array. Data resets on refresh and is not shared between users. `Actor`/role comes from the same mock current-user source other screens use.
- **AI suggestions in the UI:** no Atlas call. The Improvements tab shows rule suggestions (`runRules`) plus a clearly labelled **demo** list of AI-style suggestions from the mock data file, each marked "AI suggestion — needs review (demo data)" and starting `Proposed`, with the same Accept / Edit / Reject interactions.
- **Report gate and reassessment start:** not implemented; the UI shows a read-only status line ("Ready for report" / "To-Be approval still needed") on the Workflow tab only. The Reports and Reassessment tabs are untouched.
- Wherever a task above references the service, repository, `reportBlockersForAudit`, `saveDraft`, `startToBe` etc., read it as the equivalent client-side hook action.

## Global Constraints

- Free/open-source only; **no visible third-party logo/watermark**; bpmn-js and its code must not be installed or copied. Use `bpmn-moddle` and `diagram-js` only, after confirming each package's licence file says MIT.
- Operational Flow Audit only (audit type id `operational-flow`, capability `workflow-capture`, tab `Workflow`).
- Every As-Is has a To-Be; To-Be is created automatically when the As-Is reaches `Approved`.
- Lifecycle per model: `Draft → In Review → Awaiting Client → Approved (locked)`. HIMARK approval moves `In Review → Awaiting Client`; client approval moves `Awaiting Client → Approved`. Rejection returns to `Draft` with a comment.
- Approvals happen outside TRACE; an **Approve** button records them. **Only the Audit Lead** may click it. No client sign-in, no new client role.
- Locked (`Approved`) models are never edited in place; changes require a new version.
- Reports cannot be issued while any process flow lacks an approved To-Be.
- A reassessment's As-Is is created from the previous assessment's **approved** To-Be.
- AI is advisory: output is validated, always starts `Proposed`, and is only reachable via `atlas/`. Nothing AI-generated reaches a client or report without a recorded human decision.
- Improvement rules live in a developer-maintained file (`modules/process-flows/rules.ts`) specified by HIMARK process engineers; no rules-editing screen in this plan.
- `AGENTS.md`: this Next.js has breaking changes — read the relevant guide in `node_modules/next/dist/docs/` before writing route, client-component or dynamic-import code.
- Tested modules must be runnable by `node --experimental-strip-types`: erasable TypeScript only (no `enum`, no parameter properties, no namespaces), **relative imports with explicit `.ts`** for runtime imports, `import type` for aliased (`@/…`) type imports. Test files live at `tests/*.test.ts` (the `pnpm test` glob is not recursive).
- `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` must pass before each task's final step.
- Do not commit or push unless the product owner has authorised it; commit steps below are executed only then.
- Existing UI conventions: design tokens (`styles/trace-tokens.css`), `components/ui/*` (`crud.tsx` dialogs/toasts), `usePermissions` (`hooks/use-permissions.ts`).

## Review Focus

Most likely first; each line has a test in the owning task.

1. Importing BPMN XML that is malformed, empty, or exported from another tool (no TRACE audit data) must produce a readable error or empty audit fields — never a crash (Task 7).
2. Approvals out of order or repeated (client before HIMARK, double click, approving a `Draft`, approving a locked model) must be rejected without changing state (Tasks 2, 6).
3. AI returns garbage, a missing field, or `status: "Accepted"` for itself — must be dropped or forced to `Proposed` (Task 8).
4. An empty process (no elements) must not break diff, metrics, To-Be creation or rules (no `NaN`, no exceptions), and must not be submittable (Tasks 3, 4, 5, 6).
5. Reassessment or To-Be creation from a model that is not approved must be refused (Tasks 2, 6).

---

## File Structure

| Path | Responsibility |
|---|---|
| `types/process-flow.ts` | Domain contracts (graph, model versions, approvals, suggestions) |
| `config/roles.ts` | Add `processflow:approve` permission (Audit Lead) |
| `modules/process-flows/lifecycle.ts` | Status machine, To-Be / reassessment creation, report gate |
| `modules/process-flows/metrics.ts` | Headline numbers for a graph |
| `modules/process-flows/diff.ts` | As-Is vs To-Be diff, pain-point coverage |
| `modules/process-flows/validation.ts` | Plain-English graph validation |
| `modules/process-flows/rules.ts` | Rule catalogue + suggestion ordering/decisions |
| `modules/process-flows/process-flow.repository.ts` | Repository port |
| `modules/process-flows/process-flow.service.ts` | Orchestration (permissions, transitions, auto To-Be) |
| `data/mock/process-flows.ts` | In-memory repository + seed Purchase-to-Pay flow |
| `lib/bpmn/trace-moddle.ts`, `lib/bpmn/graph.ts`, `lib/bpmn/compare.ts` | XML ↔ `ProcessGraph`, TRACE extension, compare-XML builder |
| `lib/bpmn/editor/*` | diagram-js editor (renderer, palette, context pad, behaviours) |
| `atlas/adapters/process-flow.adapter.ts` | AI review via Atlas |
| `hooks/use-process-flow.ts` | Client hook over the service |
| `components/process-flows/*` | Workspace, stepper, editor wrapper, properties, compare, suggestions, approval bar |
| `tests/process-*.test.ts` | Unit tests |

---

### Task 1: Domain types and the approval permission

**Files:**
- Create: `types/process-flow.ts`, `tests/process-permissions.test.ts`
- Modify: `config/roles.ts` (add to `PERMISSIONS` and to `Audit Lead`)

**Interfaces — Produces** (`types/process-flow.ts`, all exported):
```ts
type ProcessModelKind = 'As-Is' | 'To-Be'
type ProcessModelStatus = 'Draft' | 'In Review' | 'Awaiting Client' | 'Approved'
type ApprovalParty = 'HIMARK' | 'Client'
interface AuditFields { owner?: string; system?: string; input?: string; output?: string; workMinutes?: number; waitMinutes?: number; approvalRequired?: boolean; control?: string; painPoint?: string; evidenceIds: readonly EntityId[] }
interface ProcessElement { id: EntityId; bpmnType: string; name: string; laneId?: EntityId; audit: AuditFields }
interface ProcessEdge { id: EntityId; sourceId: EntityId; targetId: EntityId; kind: 'sequence' | 'message'; label?: string }
interface ProcessGraph { elements: readonly ProcessElement[]; edges: readonly ProcessEdge[] }
interface ProcessFlow extends AuditAttribution { id: EntityId; auditId: EntityId; assessmentId: EntityId; name: string }
interface ProcessModelVersion extends AuditAttribution { id: EntityId; processFlowId: EntityId; kind: ProcessModelKind; version: number; status: ProcessModelStatus; xml: string; derivedFromId?: EntityId }
interface ApprovalRecord { id: EntityId; modelVersionId: EntityId; party: ApprovalParty; decision: 'Approved' | 'Rejected'; byUserId: EntityId; at: IsoDateTime; note?: string }
type SuggestionSource = 'rule' | 'ai'
type SuggestionStatus = 'Proposed' | 'Accepted' | 'Edited' | 'Rejected'
interface ProcessSuggestion { id: EntityId; processFlowId: EntityId; source: SuggestionSource; ruleId?: string; title: string; rationale: string; expectedOutcome: string; elementIds: readonly EntityId[]; dependsOn: readonly EntityId[]; priority: RecommendationPriority; effort: EffortLevel; status: SuggestionStatus; decidedBy?: EntityId; decidedAt?: IsoDateTime }
```
(`RecommendationPriority`, `EffortLevel` are imported from `types/recommendation.ts`; `AuditAttribution`, `EntityId`, `IsoDateTime` from `types/common.ts`.)
- Produces: permission string `'processflow:approve'`, held by `Audit Lead` only (Admin gets it automatically because `Admin` holds all `PERMISSIONS`; `Reviewer`, `Auditor / Consultant`, `Viewer` do not).

- [ ] **Step 1: Write the failing test** `tests/process-permissions.test.ts`: `hasPermission('Audit Lead','processflow:approve') === true`; `Reviewer`, `Auditor / Consultant`, `Viewer` are `false`. Import from `../lib/auth/permissions.ts` (check it runs under strip-types; its `@/config/roles` import is a value import, so change those two runtime imports to relative `.ts` paths in `lib/auth/permissions.ts` and `config/roles.ts`, keeping behaviour identical).
- [ ] **Step 2:** Run `node --experimental-strip-types --test tests/process-permissions.test.ts` — Expected: FAIL (permission unknown / type error at runtime assertion).
- [ ] **Step 3:** Create `types/process-flow.ts` with the interfaces above; add `'processflow:approve'` to `PERMISSIONS` and to the `Audit Lead` array in `config/roles.ts`.
- [ ] **Step 4:** Run the test — Expected: PASS. Run `pnpm typecheck` — Expected: no errors.
- [ ] **Step 5: Commit** `feat: add process flow domain types and approval permission`

---

### Task 2: Lifecycle state machine

**Files:** Create `modules/process-flows/lifecycle.ts`, `tests/process-lifecycle.test.ts`

**Interfaces — Consumes:** Task 1 types. **Produces:**
```ts
type ProcessAction = 'submit' | 'approve-himark' | 'approve-client' | 'reject'
function nextStatus(status: ProcessModelStatus, action: ProcessAction): ProcessModelStatus  // throws Error('Invalid transition: <status> + <action>')
function isLocked(status: ProcessModelStatus): boolean
function createToBe(asIs: ProcessModelVersion, args: { id: EntityId; now: IsoDateTime; userId: EntityId }): ProcessModelVersion
function createReassessmentAsIs(previousToBe: ProcessModelVersion, args: { id: EntityId; processFlowId: EntityId; now: IsoDateTime; userId: EntityId }): ProcessModelVersion
interface FlowModels { flow: ProcessFlow; asIs?: ProcessModelVersion; toBe?: ProcessModelVersion }
function reportBlockers(flows: readonly FlowModels[]): string[]  // one message per flow: `"<flow.name>" has no approved To-Be.`
```
Allowed transitions: `Draft+submit→In Review`; `In Review+approve-himark→Awaiting Client`; `Awaiting Client+approve-client→Approved`; `In Review|Awaiting Client+reject→Draft`. Everything else throws (including every action on `Approved`).

- [ ] **Step 1: Write failing tests** (names → assertions): `'follows the full happy path'` (Draft→In Review→Awaiting Client→Approved); `'client approval before HIMARK approval throws'` (`In Review+approve-client`); `'approving twice throws'` (`Awaiting Client+approve-himark`); `'approved models accept no action'`; `'reject returns to Draft from both review states'`; `'createToBe copies xml, sets kind To-Be, version 1, status Draft, derivedFromId = asIs.id, same processFlowId'`; `'createToBe refuses an As-Is that is not Approved'`; `'createToBe refuses a To-Be input'`; `'createReassessmentAsIs refuses a To-Be that is not Approved'`; `'createReassessmentAsIs yields an As-Is Draft with derivedFromId set'`; `'reportBlockers lists flows lacking an approved To-Be and is empty when all approved'`; `'reportBlockers with no flows is empty'`.
- [ ] **Step 2:** Run `node --experimental-strip-types --test tests/process-lifecycle.test.ts` — Expected: FAIL (module missing).
- [ ] **Step 3:** Implement the functions in `modules/process-flows/lifecycle.ts` (transition table as a plain object; `createdBy`/`lastModifiedBy` = `userId`, both timestamps = `now`).
- [ ] **Step 4:** Run the test — Expected: all PASS. `pnpm typecheck` clean.
- [ ] **Step 5: Commit** `feat: add process flow lifecycle`

---

### Task 3: Metrics

**Files:** Create `modules/process-flows/metrics.ts`, `tests/process-metrics.test.ts`

**Interfaces — Consumes:** `ProcessGraph`. **Produces:**
```ts
interface ProcessMetrics { steps: number; manualSteps: number; handoffs: number; approvals: number; workMinutes: number; waitMinutes: number }
function computeMetrics(graph: ProcessGraph): ProcessMetrics
function compareMetrics(asIs: ProcessMetrics, toBe: ProcessMetrics): ProcessMetrics  // toBe − asIs per field
```
Definitions (plan decisions): *step* = element whose `bpmnType` is one of `bpmn:Task, UserTask, ManualTask, ServiceTask, ScriptTask, BusinessRuleTask, SendTask, ReceiveTask, SubProcess, CallActivity`; *manual step* = `bpmn:ManualTask` or `bpmn:UserTask`; *hand-off* = sequence edge whose source and target both have a `laneId` and differ; *approvals* = elements with `audit.approvalRequired === true`; work/wait minutes = sums of `audit.workMinutes` / `audit.waitMinutes` (missing = 0).

- [ ] **Step 1: Tests:** `'counts steps, manual steps, approvals and sums times'` on a 4-element fixture; `'hand-offs count only edges crossing lanes'`; `'events and gateways are not steps'`; `'empty graph yields all zeros'` (`deepEqual` to zeros — covers Review Focus 4); `'compareMetrics returns negative deltas when the To-Be is leaner'`.
- [ ] **Step 2:** Run `node --experimental-strip-types --test tests/process-metrics.test.ts` — Expected: FAIL.
- [ ] **Step 3:** Implement per definitions above.
- [ ] **Step 4:** Run — Expected: PASS.
- [ ] **Step 5: Commit** `feat: add process metrics`

---

### Task 4: Diff and pain-point coverage

**Files:** Create `modules/process-flows/diff.ts`, `tests/process-diff.test.ts`

**Interfaces — Produces:**
```ts
type ChangedField = 'bpmnType' | 'name' | 'laneId' | 'owner' | 'system' | 'input' | 'output' | 'workMinutes' | 'waitMinutes' | 'approvalRequired' | 'control' | 'painPoint'
interface ElementChange { id: EntityId; before: ProcessElement; after: ProcessElement; fields: readonly ChangedField[] }
interface GraphDiff { removed: readonly ProcessElement[]; added: readonly ProcessElement[]; changed: readonly ElementChange[]; unchanged: readonly ProcessElement[]; flowsAdded: readonly ProcessEdge[]; flowsRemoved: readonly ProcessEdge[] }
function diffGraphs(asIs: ProcessGraph, toBe: ProcessGraph): GraphDiff   // elements matched by id; flows matched by `${sourceId}->${targetId}`
function relinkReplaced(diff: GraphDiff, removedId: EntityId, addedId: EntityId): GraphDiff  // moves the pair into `changed` (before = removed, after = added)
function uncoveredPainPoints(asIs: ProcessGraph, toBe: ProcessGraph): readonly ProcessElement[]  // As-Is elements with a non-empty painPoint that still exist in To-Be with a non-empty painPoint
```

- [ ] **Step 1: Tests:** `'identical graphs are all unchanged'`; `'element only in As-Is is removed, only in To-Be is added'`; `'changed lists exactly the differing fields (e.g. bpmnType + waitMinutes)'`; `'audit-field change counts as changed'`; `'flows added/removed matched by source->target'`; `'relinkReplaced pairs a removed and an added element as changed'`; `'relinkReplaced with unknown ids returns the diff unchanged'`; `'uncoveredPainPoints returns elements whose pain point survives, not removed or cleared ones'`; `'diff of two empty graphs is all empty'`.
- [ ] **Step 2:** Run `node --experimental-strip-types --test tests/process-diff.test.ts` — Expected: FAIL.
- [ ] **Step 3:** Implement with `Map`s keyed by id.
- [ ] **Step 4:** Run — Expected: PASS.
- [ ] **Step 5: Commit** `feat: add process graph diff`

---

### Task 5: Validation, rules and suggestion handling

**Files:** Create `modules/process-flows/validation.ts`, `modules/process-flows/rules.ts`, `tests/process-validation.test.ts`, `tests/process-rules.test.ts`

**Interfaces — Produces:**
```ts
// validation.ts
interface ValidationIssue { elementId?: EntityId; severity: 'error' | 'warning'; message: string }
function validateGraph(graph: ProcessGraph): ValidationIssue[]
// rules.ts
type SuggestionDraft = Omit<ProcessSuggestion, 'id' | 'processFlowId' | 'status' | 'decidedBy' | 'decidedAt'>
interface ProcessRule { id: string; title: string; evaluate(ctx: { asIs: ProcessGraph; toBe: ProcessGraph }): SuggestionDraft[] }
const WAIT_THRESHOLD_MINUTES = 4320
const MAX_HANDOFFS = 5
const PROCESS_RULES: readonly ProcessRule[]
function runRules(asIs: ProcessGraph, toBe: ProcessGraph): SuggestionDraft[]
function decideSuggestion(s: ProcessSuggestion, decision: 'Accepted' | 'Edited' | 'Rejected', userId: EntityId, now: IsoDateTime): ProcessSuggestion
function orderForImplementation(items: readonly ProcessSuggestion[]): ProcessSuggestion[]
function toRecommendationDraft(s: ProcessSuggestion): Pick<Recommendation, 'title' | 'expectedOutcome' | 'priority' | 'estimatedEffort' | 'dependencies'>  // throws unless status is Accepted or Edited
```
Validation messages (plain English; errors block submit, warnings do not): error `'Add a start event to show where this process begins.'` when none; error `'Add an end event to show where this process finishes.'` when none; error `'This process has no steps yet.'` for an empty graph; warning `'This decision has only one path out.'` for an `bpmn:ExclusiveGateway` with <2 outgoing sequence edges and ≥2 incoming or 0 incoming; warning `'Nothing follows this step.'` for non-end elements with no outgoing sequence edge.
Rules (ids): `manual-rekeying` (a `ManualTask` with `audit.system` set whose predecessor step has a different non-empty `audit.system`; priority High, effort Medium), `long-wait` (`waitMinutes > WAIT_THRESHOLD_MINUTES` in the To-Be; High, Low), `duplicate-approvals` (two consecutive elements both `approvalRequired`; Medium, Low), `missing-payment-control` (name matches `/pay/i` and `audit.control` empty; Critical, Medium), `excessive-handoffs` (`computeMetrics(toBe).handoffs > MAX_HANDOFFS`; Medium, High). All rules evaluate the **To-Be** (they flag what the To-Be still contains). Thresholds are placeholders for the process engineers to confirm.
`orderForImplementation`: dependencies (`dependsOn`) come before dependents; otherwise higher priority first (Critical>High>Medium>Low), then lower effort first (Low<Medium<High<Very High); cycles are broken by the same priority/effort order (never throws).

- [ ] **Step 1: Write failing tests.** Validation: `'empty graph reports no steps, no start, no end'`; `'valid linear process has no issues'`; `'exclusive gateway with a single outgoing flow warns'`; `'dangling step warns'`. Rules: one test per rule id producing a suggestion with that `ruleId` and one negative test each (fixture just under threshold produces none); `'empty To-Be yields no suggestions'`; `'decideSuggestion sets status, decidedBy, decidedAt and does not mutate input'`; `'toRecommendationDraft throws for Proposed and Rejected'`; `'orderForImplementation puts a low-priority dependency before its dependent'`; `'orderForImplementation survives a dependency cycle'`.
- [ ] **Step 2:** Run both files with `node --experimental-strip-types --test tests/process-validation.test.ts tests/process-rules.test.ts` — Expected: FAIL.
- [ ] **Step 3:** Implement. Import `computeMetrics` from `./metrics.ts`.
- [ ] **Step 4:** Run — Expected: PASS.
- [ ] **Step 5: Commit** `feat: add process validation and improvement rules`

---

### Task 6: Repository port, in-memory implementation and service

**Files:** Create `modules/process-flows/process-flow.repository.ts`, `modules/process-flows/process-flow.service.ts`, `data/mock/process-flows.ts`, `tests/process-service.test.ts`

**Interfaces — Consumes:** Tasks 1–5. **Produces:**
```ts
interface ProcessFlowRepository {
  getFlow(id: EntityId): Promise<ProcessFlow | undefined>
  listFlowsByAudit(auditId: EntityId): Promise<readonly ProcessFlow[]>
  saveFlow(flow: ProcessFlow): Promise<void>
  getModel(id: EntityId): Promise<ProcessModelVersion | undefined>
  listModels(processFlowId: EntityId): Promise<readonly ProcessModelVersion[]>
  saveModel(model: ProcessModelVersion): Promise<void>
  appendApproval(record: ApprovalRecord): Promise<void>
  listApprovals(modelVersionId: EntityId): Promise<readonly ApprovalRecord[]>
  saveSuggestions(processFlowId: EntityId, items: readonly ProcessSuggestion[]): Promise<void>
  listSuggestions(processFlowId: EntityId): Promise<readonly ProcessSuggestion[]>
}
interface Actor { userId: EntityId; role: UserRole }
// data/mock/process-flows.ts
function createInMemoryProcessFlowRepository(seed?: { flows?: ProcessFlow[]; models?: ProcessModelVersion[] }): ProcessFlowRepository
// service
class ProcessFlowService {
  constructor(repo: ProcessFlowRepository, parseGraph: (xml: string) => Promise<ProcessGraph>, now: () => IsoDateTime, newId: () => EntityId)  // assign fields explicitly; no parameter properties
  saveDraft(modelId: EntityId, xml: string, actor: Actor): Promise<ProcessModelVersion>      // throws if locked or not Draft
  submit(modelId: EntityId, actor: Actor): Promise<ProcessModelVersion>                      // throws if validateGraph has any 'error'
  approve(modelId: EntityId, party: ApprovalParty, actor: Actor, note?: string): Promise<{ model: ProcessModelVersion; toBe?: ProcessModelVersion }>
  reject(modelId: EntityId, party: ApprovalParty, actor: Actor, note: string): Promise<ProcessModelVersion>   // note must be non-empty
  startToBe(asIsId: EntityId, actor: Actor): Promise<ProcessModelVersion>                    // idempotent: returns the existing To-Be if one exists
  startReassessmentAsIs(previousToBeId: EntityId, newFlow: ProcessFlow, actor: Actor): Promise<ProcessModelVersion>
  reportBlockersForAudit(auditId: EntityId): Promise<string[]>
}
```
`approve` requires `hasPermission(actor.role, 'processflow:approve')` else throws `Error('Permission denied: processflow:approve')`; party `HIMARK` ⇒ action `approve-himark`, party `Client` ⇒ `approve-client`; appends an `ApprovalRecord`; when an As-Is becomes `Approved` it auto-creates the To-Be via `startToBe` and returns it as `toBe`.

- [ ] **Step 1: Write failing tests** (in-memory repo, fixed `now`/`newId`, `parseGraph` stub returning fixtures): `'non-Audit-Lead cannot approve'` (Reviewer, Auditor, Viewer → rejects, status and approvals unchanged); `'happy path As-Is: submit, HIMARK, Client approve → Approved and a Draft To-Be is auto-created with derivedFromId'`; `'client approval before HIMARK approval rejects and records nothing'`; `'second HIMARK approval rejects'`; `'submit rejects an empty graph'` (Review Focus 4); `'reject without a note rejects'`; `'reject returns Draft and keeps the rejection record'`; `'saveDraft on an Approved model rejects and leaves xml unchanged'`; `'startToBe on a non-Approved As-Is rejects'`; `'startToBe called twice returns the same To-Be'`; `'startReassessmentAsIs rejects when the previous To-Be is not Approved'`; `'startReassessmentAsIs creates an As-Is Draft in the new flow'`; `'reportBlockersForAudit lists flows without an approved To-Be'`.
- [ ] **Step 2:** Run `node --experimental-strip-types --test tests/process-service.test.ts` — Expected: FAIL.
- [ ] **Step 3:** Implement the port, in-memory repo (`Map`s, return copies) and service. Also add a seed in `data/mock/process-flows.ts`: one Purchase-to-Pay flow on the existing Operational Flow audit id (find it with `grep -n "OF" data/mock/trace.ts`) with an As-Is `Draft`, XML produced in Task 7.
- [ ] **Step 4:** Run — Expected: PASS. `pnpm typecheck` clean.
- [ ] **Step 5: Commit** `feat: add process flow service and mock repository`

---

### Task 7: BPMN XML adapter with TRACE extension

**Files:** Modify `package.json` (via `pnpm add bpmn-moddle`). Create `lib/bpmn/trace-moddle.ts`, `lib/bpmn/graph.ts`, `lib/bpmn/compare.ts`, `tests/bpmn-graph.test.ts`.

- [ ] **Step 1: Confirm the licence.** `pnpm add bpmn-moddle diagram-js`; open each package's `LICENSE` in `node_modules` and confirm MIT. If either is not MIT, stop and report to the product owner. Confirm `bpmn-js` is **not** in `package.json`/lockfile.

**Interfaces — Produces:**
```ts
// trace-moddle.ts: moddle package descriptor, prefix 'trace', uri 'http://himark.co.za/schema/trace/1.0',
// type 'trace:AuditFields' attached under bpmn:BaseElement extensionElements, properties = AuditFields keys.
function createModdle(): BpmnModdle
// graph.ts
type ParseResult = { ok: true; graph: ProcessGraph } | { ok: false; error: string }
function parseBpmnXml(xml: string): Promise<ParseResult>        // never throws; lanes → laneId via flowNodeRef; SequenceFlow→'sequence', MessageFlow→'message'
function emptyProcessXml(processName: string): Promise<string> // one participant, no lanes, with a diagram (DI) plane
function setAuditFieldsInXml(xml: string, elementId: EntityId, fields: AuditFields): Promise<string>
// compare.ts
function buildCompareXml(asIsXml: string, toBeXml: string, removedIds: readonly EntityId[]): Promise<string> // To-Be XML plus copies of the removed As-Is flow nodes and their DI shapes at their As-Is coordinates
```

- [ ] **Step 2: Write failing tests** (`tests/bpmn-graph.test.ts`): `'round-trips audit fields through XML'` (set → parse equals); `'parses lanes into laneId and flows into edges'` using an inline XML fixture; `'foreign BPMN without TRACE data yields empty audit fields'` (`evidenceIds: []`); `'malformed XML returns ok:false with a message'`; `'empty string returns ok:false'` (Review Focus 1); `'emptyProcessXml parses ok with zero elements'`; `'buildCompareXml contains the removed element ids and still parses'`.
- [ ] **Step 3:** Run `node --experimental-strip-types --test tests/bpmn-graph.test.ts` — Expected: FAIL.
- [ ] **Step 4:** Implement with `bpmn-moddle` (`fromXML`/`toXML`; catch every rejection into `ok:false`). Wire `data/mock/process-flows.ts` seed to use `parseBpmnXml` output fixtures.
- [ ] **Step 5:** Run — Expected: PASS; `pnpm typecheck` clean.
- [ ] **Step 6: Commit** `feat: add BPMN xml adapter with TRACE extension`

---

### Task 8: Atlas adapter for AI review

**Files:** Create `atlas/adapters/process-flow.adapter.ts`, `tests/process-ai.test.ts`

**Interfaces — Consumes:** `AtlasClient` (`atlas/atlas.types.ts`); follow the shape of `atlas/adapters/audit.adapter.ts`. **Produces:**
```ts
function parseAiSuggestions(raw: unknown, processFlowId: EntityId): ProcessSuggestion[]   // never throws
function reviewProcessFlow(client: AtlasClient, args: { organisationId: EntityId; processFlowId: EntityId; asIs: ProcessGraph; toBe: ProcessGraph }): Promise<ProcessSuggestion[]>   // operation 'process-flow.review'; returns [] if the client rejects
```
Parsing rules: input must be an array; each item needs string `title` and `rationale`; `priority`/`effort` must be valid values else the item is dropped; `elementIds`/`dependsOn` default to `[]` (non-strings removed); output `source: 'ai'`, `status: 'Proposed'` **always**, ignoring any supplied status/decidedBy.

- [ ] **Step 1: Failing tests:** `'valid items become Proposed ai suggestions'`; `'a supplied status of Accepted is ignored'` (Review Focus 3); `'items missing title or with invalid priority are dropped'`; `'non-array input yields []'` for `null`, `'x'`, `{}`; `'reviewProcessFlow sends operation process-flow.review with both graphs'` (fake client records the request); `'reviewProcessFlow returns [] when the client throws'`.
- [ ] **Step 2:** Run `node --experimental-strip-types --test tests/process-ai.test.ts` — Expected: FAIL.
- [ ] **Step 3:** Implement. Ids: `ai-<processFlowId>-<index>`.
- [ ] **Step 4:** Run — Expected: PASS.
- [ ] **Step 5: Commit** `feat: add Atlas process flow review adapter`

---

### Task 9: Editor core (diagram-js) and Stage 1 shapes

**Files:** Create `lib/bpmn/editor/index.ts`, `lib/bpmn/editor/renderer.ts`, `lib/bpmn/editor/types.ts`; create `components/process-flows/bpmn-editor.tsx`. No node unit test is possible (needs a browser canvas); verification is typecheck + a manual browser check.

**Interfaces — Produces** (`lib/bpmn/editor/types.ts`):
```ts
type CompareState = 'added' | 'removed' | 'changed' | 'unchanged'
interface ProcessEditor {
  importXml(xml: string): Promise<void>
  exportXml(): Promise<string>
  onSelection(cb: (elementId: EntityId | null) => void): () => void
  onChange(cb: () => void): () => void
  getAuditFields(elementId: EntityId): AuditFields
  setAuditFields(elementId: EntityId, fields: AuditFields): void
  setCompareStates(states: Readonly<Record<EntityId, CompareState>>): void
  setIssues(issues: readonly ValidationIssue[]): void
  fit(): void; undo(): void; redo(): void; zoomBy(delta: number): void
  destroy(): void
}
function createProcessEditor(container: HTMLElement, options: { readOnly: boolean }): ProcessEditor
```
`BpmnEditor` React component props: `{ xml: string; readOnly: boolean; onXmlChange?(xml: string): void; onSelect?(id: EntityId | null): void; compareStates?: Record<EntityId, CompareState>; issues?: ValidationIssue[]; editorRef?: Ref<ProcessEditor> }`. It must be loaded with `next/dynamic` and `ssr: false` (read the Next dynamic-import guide first).

- [ ] **Step 1:** Read `node_modules/next/dist/docs/` guides for client components and dynamic imports; note the exact API in a one-line code comment.
- [ ] **Step 2:** Compose `diagram-js` core (canvas, selection, move, resize, create, connect, modeling, keyboard, zoom-scroll, undo via command stack) with `bpmn-moddle` as the semantic model. Verify the module names against the installed `diagram-js` version. Do not import or copy anything from `bpmn-js`.
- [ ] **Step 3:** `renderer.ts`: SVG drawing for the Stage 1 element set (event circles — thin start, thick end; rounded-rectangle tasks with type icons for user/manual/service; diamond with ✕ for exclusive gateway; solid arrow sequence flows; dashed open-arrow message flows; participant/lane frames). Colours use CSS variables from `styles/trace-tokens.css` so light/dark themes work. Compare states add outline colours red/green/amber and a ghost style for removed.
- [ ] **Step 4:** Implement `createProcessEditor` (`importXml` uses Task 7's `createModdle`; `exportXml` returns valid BPMN with DI). No watermark or third-party logo is rendered anywhere.
- [ ] **Step 5: Verify.** `pnpm typecheck` and `pnpm lint` clean. Start the dev server (`pnpm dev`), open a scratch route or the Workflow tab, import the seed XML, and confirm: all Stage 1 shapes render, select/move/undo/redo work, `exportXml()` re-imports to an identical graph (via `parseBpmnXml`), and no logo appears. Record the result in the task notes.
- [ ] **Step 6: Commit** `feat: add diagram-js based BPMN editor core`

---

### Task 10: Editor usability layer (progressive palette, quick-add, live validation)

**Files:** Create `lib/bpmn/editor/palette.ts`, `lib/bpmn/editor/context-pad.ts`; modify `lib/bpmn/editor/index.ts`, `components/process-flows/bpmn-editor.tsx`. Create `components/process-flows/editor-toolbar.tsx`.

- [ ] **Step 1: Palette.** Basics group only on load (Start, Task, Decision, End) using plain-language labels with the BPMN name as secondary text; a "More elements" group and a search box list every element the editor currently supports (Stage 1 set now; later plans append). Entries are data in `palette.ts` so Plans 2–3 only add rows.
- [ ] **Step 2: Context pad.** Selecting an element offers "add next step", "add decision", "add end", "connect to…", "delete"; dragging from the pad creates and connects in one gesture; auto-position the new element to the right of the source.
- [ ] **Step 3: Toolbar.** `editor-toolbar.tsx` wires working Undo, Redo, Zoom in/out, Fit, and a search field that selects the matching element by name (replacing the inert controls in the old `workflow-canvas.tsx`). Keyboard: Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z, Delete, Ctrl/Cmd+0 fit.
- [ ] **Step 4: Live validation.** Component runs `validateGraph(parse(exportXml))` (debounced 400 ms after `onChange`) and passes issues to `editor.setIssues`; the editor shows a badge on the element and the toolbar shows a count; clicking an issue selects its element. Drawing is never blocked.
- [ ] **Step 5: Verify manually** in the browser: a first-time user can draw Start → Task → Decision → two Tasks → End using only the basics group and context pad; an unfinished decision shows `This decision has only one path out.`; undo/redo/zoom/fit/search work. `pnpm typecheck` and `pnpm lint` clean.
- [ ] **Step 6: Commit** `feat: add progressive palette, quick-add and live validation`

---

### Task 11: Properties panel (audit fields)

**Files:** Create `components/process-flows/element-properties-panel.tsx`

**Interfaces — Consumes:** `ProcessEditor.getAuditFields/setAuditFields`, `onSelection`. Props: `{ editor: ProcessEditor | null; selectedId: EntityId | null; readOnly: boolean }`.

- [ ] **Step 1:** Render for the selected element: name (BPMN type read-only label), lane/owner, system, input, output, work time (minutes), wait time (minutes), approval required (toggle), control, pain point (textarea, red-tinted when set), evidence (count + link to the audit's Evidence tab). Use `components/ui/input.tsx`, `textarea.tsx`, `select.tsx`. Numeric fields reject negatives and non-numbers (inline message, no write).
- [ ] **Step 2:** Edits call `setAuditFields` immediately (no save button); `readOnly` disables every control. Include "Raise finding" and "Link recommendation" actions that call props `onRaiseFinding(elementId)` / `onLinkRecommendation(elementId)` (wired in Task 13).
- [ ] **Step 3: Verify manually:** edit a task's fields, export the XML, re-import, and confirm the values persist; a locked model shows disabled controls. `pnpm typecheck` and `pnpm lint` clean.
- [ ] **Step 4: Commit** `feat: add element audit-fields properties panel`

---

### Task 12: Pools and lanes

**Files:** Modify `lib/bpmn/editor/renderer.ts`, `lib/bpmn/editor/index.ts`, `lib/bpmn/editor/palette.ts`

- [ ] **Step 1:** Palette entries "Process (pool)" and "Lane"; a pool created on an empty canvas wraps the existing flow nodes; lanes split a pool vertically/horizontally per the participant's orientation (horizontal pools only in this plan).
- [ ] **Step 2:** Moving a flow node between lanes updates the lane's `flowNodeRef`s so `parseBpmnXml` returns the new `laneId`; resizing a pool/lane keeps contained nodes inside; deleting a lane moves its nodes to the pool root.
- [ ] **Step 3:** Message flows may connect elements in different pools only (connection rule); sequence flows may not cross pools.
- [ ] **Step 4: Verify manually:** build the mockup's Requester / Line Manager / Finance lanes, drag a task across lanes, re-export, and confirm `parseBpmnXml` shows the changed `laneId` and `computeMetrics(...).handoffs` changes. Add a unit test in `tests/bpmn-graph.test.ts`: `'moving a node between lanes in XML changes its laneId'` using a hand-edited XML fixture.
- [ ] **Step 5: Commit** `feat: add pools and lanes to the editor`

---

### Task 13: Workspace, lifecycle UI, approvals, compare view and suggestions

**Files:**
- Create: `hooks/use-process-flow.ts`, `components/process-flows/process-flow-workspace.tsx`, `stage-stepper.tsx`, `approval-bar.tsx`, `compare-view.tsx`, `gap-list.tsx`, `suggestions-panel.tsx`
- Modify: `app/(dashboard)/audits/[auditId]/workflow/page.tsx` (replace `<WorkflowCanvas/>` with `<ProcessFlowWorkspace auditId=…/>`)
- Delete (after confirming no other imports with `grep -rn "workflow-canvas\|workflow-node\|workflow-step-form\|workflow-summary\|WorkflowStepMock\|types/workflow" --include=*.ts --include=*.tsx .`): `components/workflows/*`, the `workflowSteps`/`WorkflowStepMock` exports in `data/mock/audit-workflows.ts`; keep `types/workflow.ts` only if still imported.

**Interfaces — Consumes:** Tasks 2–9, 11. `useProcessFlow(auditId: EntityId)` returns `{ flow, asIs, toBe, approvals, suggestions, loading, error, actions: { saveDraft(modelId, xml), submit(modelId), approve(modelId, party, note?), reject(modelId, party, note), decideSuggestion(id, decision), runReview() } }`; role comes from the current session (use the same source as `usePermissions` callers).

- [ ] **Step 1:** `stage-stepper.tsx`: the seven-stage strip from the approved mockup (As-Is Draft / In Review / Approved, To-Be Draft / In Review / Approved, Gaps & Recommendations) driven by model statuses; `Awaiting Client` shows under "In Review".
- [ ] **Step 2:** `approval-bar.tsx`: shows current status, **Submit for review** (any auditor), **Approve — HIMARK** / **Approve — Client** buttons and **Request changes** (requires a comment). Approve buttons are rendered only when `usePermissions(role).can('processflow:approve')`; the Approve button for the wrong stage is disabled with a tooltip explaining the order. Each approval opens `ConfirmActionDialog`-style confirmation with an optional note field ("approved on call, 12 Nov"). Approval history list underneath (who, when, party, note).
- [ ] **Step 3:** `process-flow-workspace.tsx`: tabs As-Is / To-Be / Compare / Improvements. Editor is read-only when `isLocked(status)` or status ≠ `Draft`. When the As-Is becomes `Approved`, switch to the To-Be tab and show a toast "To-Be created from the approved As-Is — edit what changes." If a To-Be does not exist yet for an Approved As-Is (e.g. legacy data), show a blocking banner with "Create To-Be".
- [ ] **Step 4:** `compare-view.tsx` + `gap-list.tsx`: `diffGraphs` → `BpmnEditor` (read-only) loading `buildCompareXml(asIs.xml, toBe.xml, removedIds)` with `compareStates`; headline numbers from `computeMetrics` + `compareMetrics`; gap list rows (Removed / Changed / Added / Not addressed from `uncoveredPainPoints`) that select the element on click; a "This replaces that" action calling `relinkReplaced` (session-only state, noted in the UI).
- [ ] **Step 5:** `suggestions-panel.tsx`: combines `runRules(asIs, toBe)` (source badge "Rule") with `actions.runReview()` results (source badge "AI", labelled "AI suggestion — needs review"); each has Accept / Edit / Reject (calls `decideSuggestion`, persisting through the service); Accepted/Edited items appear in implementation order from `orderForImplementation` and offer "Create recommendation" using `toRecommendationDraft`. Nothing from the AI is shown as accepted until a human decides.
- [ ] **Step 6: Verify manually** through the full lifecycle in the browser as an Audit Lead and again as a Reviewer: Reviewer sees no Approve buttons; Audit Lead completes As-Is → To-Be creation → To-Be approval; locked models are read-only; Compare shows red/green/amber and the gap list matches; suggestions need a decision. `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` all pass.
- [ ] **Step 7: Commit** `feat: add process flow workspace with lifecycle, compare view and suggestions`

---

### Task 14: Report gate and reassessment start

**Files:** Modify the component that renders the Reports tab and issue action (find with `grep -n "Reports" components/audits/audit-section-view.tsx` and the `reports` page), and the Reassessment tab component (`app/(dashboard)/audits/[auditId]/reassessment/page.tsx` and what it renders). Test: extend `tests/process-service.test.ts`.

- [ ] **Step 1:** In the Reports view, call `reportBlockersForAudit` and disable the issue/generate control when non-empty, listing each blocker with a link to the Workflow tab. Operational Flow audits only; other audit types unchanged.
- [ ] **Step 2:** In the Reassessment view for Operational Flow audits, add "Start reassessment from the approved To-Be" which calls `startReassessmentAsIs`; disabled with the reason "The previous To-Be is not approved yet." when it isn't. Reuse the existing reassessment flow's `previousAssessmentId` (`types/assessment.ts`).
- [ ] **Step 3:** Add service tests if not already covering: `'reportBlockersForAudit is empty once every flow has an approved To-Be'`.
- [ ] **Step 4: Verify manually** both gates in the browser, then `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build`.
- [ ] **Step 5: Commit** `feat: gate reports on approved To-Be and start reassessments from it`

---

### Task 15: Documentation

**Files:** Modify `README.md`, `tests/README.md`

- [ ] **Step 1:** README: add a "Process flows" section (BPMN builder, lifecycle, approvals by Audit Lead, rules file location, free-licence constraint and Stage 1 element list, pointer to the spec). `tests/README.md`: replace the "no tests" sentence with how to run `pnpm test` and the erasable-TypeScript rule.
- [ ] **Step 2:** Run `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build` — Expected: all pass.
- [ ] **Step 3: Commit** `docs: document process flow builder`

---

## Self-Review (done)

- **Spec coverage:** editor + XML import/export (T7, T9–T12; full breadth deferred to Plans 2–3, stated at the top); audit data per element (T7, T11); usability (T10); lifecycle, auto To-Be, gate (T2, T6, T13, T14); two approvals via Approve button, Audit Lead only, no client role (T1, T6, T13); locked versions (T2, T6); gap view and metrics (T3, T4, T13); pain-point coverage (T4, T13); rules by process engineers in a file (T5); AI advisory via Atlas with human decisions (T8, T13); reassessment from previous approved To-Be (T2, T6, T14); free libraries/no logo (Global Constraints, T7 step 1); old Workflow tab replaced (T13).
- **Types:** `ProcessGraph`, `ProcessModelVersion`, `ProcessSuggestion`, `Actor`, `ProcessEditor` names match across tasks.
- **Plan decisions to confirm** (made here, not in the spec): extra status `Awaiting Client`; new permission `processflow:approve` instead of reusing `assessment:approve/signoff` (reusing them would let the Reviewer role click Approve); definition of manual step/hand-off; rule thresholds `WAIT_THRESHOLD_MINUTES = 4320` and `MAX_HANDOFFS = 5`; rules evaluate the To-Be; compare view draws removed elements at their As-Is coordinates and may overlap To-Be shapes; mock repository means data resets on refresh until a real backend exists.
