# TRACE usability testing specification

## Status and purpose

This document prepares TRACE for structured, moderated usability testing. It is a research plan, not a record of completed research. No real-user testing was conducted as part of the implementation pass.

The study should establish whether an auditor can create, configure, complete, leave, and resume an assessment without losing context or confidence in saved work. Test with 5–8 participants across Audit Lead, Auditor / Consultant, Reviewer, and less-experienced Viewer or stakeholder profiles.

## Session setup

- Duration: 45–60 minutes.
- Device coverage: at least three desktop sessions, two mobile sessions, and one tablet session.
- Data: use a non-production Oak & Pixel workspace with representative frameworks, templates, evidence, and team members.
- Recording: obtain consent before recording screen, voice, or camera.
- Moderator stance: ask participants to think aloud; do not teach the interface or explain TRACE terminology unless the task is otherwise blocked.
- Privacy: do not use real client information or upload confidential evidence.

Before each task, record the participant’s role, audit experience, familiarity with TRACE, device, viewport, and whether assistive technology is used.

## Scenario 1 — Create a Website Audit from scratch

**Goal:** Create a Website Audit for Oak & Pixel without using a template.

**Prompt:** “Oak & Pixel wants a website assessment covering mobile and desktop, up to 250 pages. Alex will lead the audit and Maya will review it. Set up the audit and stop when you believe it is ready to create.”

Observe whether the participant:

- understands the available Audit Types;
- can distinguish required and optional details;
- configures the scope correctly;
- understands what the selected Framework changes;
- assigns the Audit Lead and Reviewer;
- uses the Review step to identify missing or risky configuration;
- understands Save Draft and Create Audit;
- hesitates, backtracks, or requests help because of terminology.

Success criteria: the correct type, organisation, scope, framework, lead, and reviewer are present at Review, and the participant can state what Create Audit will do.

## Scenario 2 — Create an audit from a Template

**Goal:** Create the same website audit using an existing Template.

**Prompt:** “Now create a similar Oak & Pixel website audit using the Website Audit v1.0 template. Review the values the template applies and make any changes you consider necessary.”

Observe whether the participant:

- finds the template entry point;
- notices which values were prepopulated;
- trusts but verifies the defaults;
- understands that template values remain editable;
- can remove or change the applied template;
- completes the task noticeably faster than Scenario 1.

Compare time on task, errors, backtracking, and confidence with Scenario 1.

## Scenario 3 — Complete assessment checks

**Goal:** Complete several checks in an in-progress Website Audit.

**Prompt:** “Continue the Oak & Pixel baseline assessment. Complete the next three checks, attach evidence to one check, and create a finding for a failed condition.”

Observe whether the participant understands:

- which audit and assessment are active;
- the current section and check;
- the expected condition and required response;
- section and overall progress;
- when a response is saved, saving, or unsaved;
- how evidence and findings relate to the current check;
- how to move to the previous or next check.

Success criteria: three checks are completed, evidence remains linked to the intended check, a finding is created with inherited context, and the participant can explain what remains.

## Scenario 4 — Add Evidence

**Goal:** Attach evidence to a specific assessment check without leaving the assessment context.

**Prompt:** “Attach a page-load report to the current Performance check and mark it as requiring review.”

Observe whether the participant understands:

- Evidence Type and Source;
- the prepopulated Organisation, Audit, Assessment, Section, and Check;
- which relationships are editable;
- validation and review status;
- upload progress, completion feedback, and the return to the originating check.

Success criteria: the evidence is attached to the correct check, is set to Needs Review, and the participant returns to the same assessment location.

## Scenario 5 — Resume an assessment

**Goal:** Leave an incomplete assessment and return later.

**Prompt:** “Leave this assessment, navigate elsewhere in TRACE, and then return to continue where you stopped.”

Observe whether the participant immediately understands:

- where they stopped;
- what has already been saved;
- what remains incomplete;
- the difference between audit progress and section progress;
- which action resumes the work.

Success criteria: the participant resumes the correct assessment area and can identify the next incomplete check without moderator assistance.

## Metrics and capture sheet

Capture these measures per scenario:

| Measure | Definition |
| --- | --- |
| Task completion rate | Completed without help, completed with help, or not completed |
| Time on task | From prompt completion to participant-declared completion |
| Error rate | Incorrect action, invalid configuration, or wrong relationship |
| Backtracking | Returns to an earlier step or page to recover or verify |
| Abandonment | Participant stops or cannot proceed |
| Help requests | Explicit requests for moderator guidance |
| Misclicks | Actions immediately reversed or acknowledged as unintended |
| User confidence | Participant rating from 1 (not confident) to 5 (very confident) |
| Terminology confusion | Term, label, or concept misunderstood or questioned |

Also note the first click, long pauses over 10 seconds, use of browser Back, unexpected navigation, overlooked feedback, and comments about trust or saved state.

## Moderator guidance

- Read task prompts consistently and avoid pointing at controls.
- If a participant asks what a term means, first ask what they expect it to mean.
- Use neutral probes: “What are you looking for?”, “What do you expect to happen?”, and “How would you know that was saved?”
- Record assistance as a help request and distinguish a small hint from step-by-step intervention.
- Do not treat prototype limitations as participant errors.
- After a serious failure, allow the participant to continue so downstream comprehension can still be observed.

## Post-task questionnaire

After each task, ask:

1. How confident are you that you completed the task correctly? (1–5)
2. How easy or difficult was the task? (1–5, very difficult to very easy)
3. Was anything labelled differently from what you expected?
4. At any point, were you unsure whether your work was saved?
5. What was the most confusing part of this task?
6. What, if anything, made the task feel efficient?

At the end of the session, ask:

- Which area of TRACE felt clearest?
- Which area felt most overwhelming?
- Did you always know which audit or assessment you were working in?
- What would you change before using TRACE on a real client audit?
- Would you feel comfortable resuming this work a week later? Why?

## Analysis and decision rules

Group findings by scenario, role, and severity. Treat a problem as high priority when it blocks completion for any participant, causes incorrect audit relationships, creates uncertainty about saved work, or occurs for at least two participants. Preserve observed quotes separately from interpretation.

Do not decide terminology, the ideal amount of assessment guidance, or the final mobile information hierarchy from internal review alone. Use observed task behaviour and participant language before making those product decisions.

Do not add analytics or session-recording libraries without explicit product, security, and privacy approval.
