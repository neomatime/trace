# TRACE benchmark feature-gap audit

## Scope and decision rule

This audit compares TRACE's reachable UI and repository foundations with recurring patterns in audit-management products. A feature is implemented only where it strengthens TRACE's existing audit lifecycle. Features that would turn TRACE into a task manager, broad GRC suite, or workforce-planning system are explicitly deferred or excluded.

The current product already has a strong foundation: four specialised audit types, versioned frameworks and templates, structured collection, evidence lineage, findings, recommendations, reassessment history, user attribution, permissions, and activity logging.

## Classification matrix

| Capability | Classification before this pass | Evidence in TRACE | Decision |
| --- | --- | --- | --- |
| Quality Review / Sign-off | PARTIAL | `Under Review` states, audit reviewer/approver attribution fields, review permissions, evidence review and framework approval exist, but there is no assessment-level submit/review/changes-requested/approve/sign-off workspace. | Implement an assessment Review workspace with a governed lifecycle, checklist, notes, attribution and sign-off guardrails. |
| Corrective Actions / Action Plans | MISSING | Recommendations have owners and lifecycle labels, but no remediation action record with assignee, due date, evidence, priority, status and verification. | Implement remediation-only Actions inside each audit. Keep it deliberately narrower than HIVE task/project management. |
| Finding Follow-up / Verification | PARTIAL | Findings support open, in-progress and resolved states; reassessments exist. There is no verification state, verification owner/date/evidence, or explicit linkage to remediation actions. | Extend through the Actions workspace and finding verification summaries. A finding is not closed merely because an action is marked complete. |
| Automated Reports | PARTIAL | Export affordances and report-style views exist, but no report configuration, section selection, preview, schedule or transparent generation status. | Implement a report configuration and preview workspace. Clearly mark document generation/delivery as requiring a backend worker; never show a fake generated file. |
| Conditional Assessment Logic | MISSING | Frameworks support checks, scoring, evidence and failure-rule toggles only. | Add self-service no-code conditional rules to framework Scoring: trigger, operator, value, resulting action and target. |
| Recurring Audits | PARTIAL | Reassessment dates, due-soon views and reassessment history exist, but no reusable cadence configuration. | Implement recurring schedule configuration in audit Planning, reusing reassessment lineage. |
| Cross-Audit Analytics | PARTIAL | History already provides score trends, improvement rate, types and reassessment comparisons. | Extend History with a cross-audit Analytics view rather than creating a separate BI product. |
| Audit Workpapers | MISSING | Evidence and collection notes exist, but no prepared/reviewed workpaper record or review-note lifecycle. | Add a lightweight Workpapers workspace tied to audit sections, evidence and reviewer sign-off. |
| Audit Planning Calendar | PARTIAL | Due dates and a non-functional “View calendar” affordance exist. | Implement an audit calendar/agenda view from the Audits register. Do not add workforce allocation. |
| Risk Register | MISSING | Findings and risks are represented only within audit context. | DEFER. A central enterprise risk register is a broad GRC capability and would materially change TRACE's product boundary. |
| Control Library | COMPLETE | Versioned framework sections and reusable checks already act as TRACE's control/criteria library with evidence and scoring rules. | Do not duplicate it with a second control module. Improve naming/documentation only when needed. |
| Framework / Requirement Mapping | MISSING | Checks belong to one framework and do not map across regulatory standards. | DEFER. Useful later for compliance-heavy customers, but not required for the current assessment product. |
| Offline Assessment Mode | MISSING | No service worker, durable client sync store, conflict resolution or offline security model exists. | DEFER. A cosmetic offline toggle would be misleading; implement only with real encrypted local storage and sync semantics. |
| Audit Resource Planning | MISSING | Audit owners and participants exist, but no capacity, time budget or utilisation planning. | NOT APPLICABLE. Workforce planning belongs in HIVE/UNISON; TRACE retains audit owner/reviewer assignments only. |

## Benchmark patterns used

- End-to-end audit products consistently join planning, fieldwork, review, reporting, issue tracking and follow-up.
- Review notes and preparer/reviewer/sign-off attribution are audit-quality controls, not optional collaboration extras.
- Findings commonly produce action plans whose remediation progress remains visible until independent verification.
- Configurable report templates and issue/status analytics are common, but TRACE should not imply a report file exists until a generation service actually creates it.
- Risk and compliance suites commonly separate audit management from enterprise risk/control products. TRACE should preserve that boundary.

## Implementation boundary

This pass is a frontend and domain-contract foundation. New state is intentionally local/mock where no approved backend exists. Every such surface is labelled honestly. No mock interaction claims that an email was sent, a recurring server job was scheduled, an offline sync completed, or a report file was generated.

## Deferred backend work

Before production use, implement repository/service adapters for assessment review events, remediation actions, workpapers, report jobs and recurring schedule jobs. Those adapters must enforce organisation tenancy, role permissions, immutable audit events and authenticated user attribution.
