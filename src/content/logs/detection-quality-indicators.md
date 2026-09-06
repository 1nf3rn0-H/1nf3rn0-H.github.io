---
title: "Detection Quality Indicators: A Structured Approach to Better Detections"
description: "A practical framework for evaluating detection intent, resilience, operational cost, and production outcomes."
publishedAt: 2025-11-17
updatedAt: 2026-07-18
status: published
type: article
category: detection-engineering
tags: [detection-engineering, detection-quality, detection-as-code, telemetry, reliability]
difficulty: intermediate
featured: false
tools: [Git, CI/CD, SIEM, ATT&CK]
mitre: [T1059, T1547]
---

## Delivery discipline is not a quality guarantee

Detection-as-Code gives teams a safer way to store, review, test, and deploy content. That is essential—but a well-managed repository can still contain weak detections. Version-controlling a brittle indicator, deploying an unscoped query, or automating an alert that nobody can triage does not make it valuable.

Detection quality is the ability of a detection to remain useful in the environment where it runs. It must represent meaningful adversary behaviour, fit the organization’s telemetry and risk profile, produce usable analyst context, and run reliably enough to be trusted. Those properties need to be evaluated before release and measured after it.

This is a framework for that conversation. It is not a universal scorecard: a high-volume hunting analytic should be judged differently from a page-worthy SOC alert. What matters is agreeing on the intended consumer, the cost of being wrong, and the evidence required before calling a detection healthy.

## The four questions behind every good detection

Before asking whether a rule is noisy, ask four more fundamental questions:

1. **Intent:** What adversary behaviour is it meant to expose?
2. **Evidence:** Which telemetry proves or supports that behaviour?
3. **Operation:** Can the platform and response team sustain it at the intended scale?
4. **Outcome:** What happened when the detection met real data?

The questions move the discussion beyond “does it match?” A rule that detects a known hash may match correctly, but it has a short useful life. A rule that identifies a behaviour chain—such as a suspicious process launching a script interpreter followed by an unusual network connection—may be more resilient, provided the necessary process and network evidence is actually available.

The goal is not to eliminate indicators of compromise. They can be excellent short-lived controls. The goal is to label them honestly and avoid confusing a narrow, volatile signal with durable behavioural coverage.

## A quality model across the lifecycle

Quality has two phases: properties that can be assessed before deployment, and evidence that appears only once a detection meets production telemetry. Automation sits between them, enforcing the checks that should not rely on memory or manual consistency.

```text
Detection intent and threat model
              │
              ▼
Pre-deployment review ──► automated checks ──► controlled release
              │                                          │
              └─────────────── feedback ◄───────────────┘
                                     │
                                     ▼
                          production quality signals
```

This cycle deliberately avoids a single “detection quality score.” A score can be useful for tracking improvement, but it can also conceal trade-offs. A high-fidelity analyst alert might have low coverage; a broad hunting analytic may be valuable despite low precision. Keep the component measures visible before collapsing them into a number.

## Pre-deployment: assess the design

### Intent and behavioural depth

State the behaviour in plain language, then identify the traces it should leave. “Detect PowerShell” is not an intent. “Identify PowerShell used to retrieve remote content from user workstations, with process and command-line context for triage” is one.

Behavioural intent helps teams look beyond a single artifact or data source. Consider where the activity could appear: endpoint process telemetry, script-block logging, proxy records, DNS, identity activity, or cloud audit events. A detection does not need every source, but its chosen evidence and blind spots should be explicit.

### Resilience to ordinary variation

Adversaries change arguments, casing, paths, encodings, domains, and tools. Environments also change through software upgrades, legitimate automation, and parser revisions. A quality review should challenge simple assumptions:

- Does the logic handle meaningful aliases and equivalent commands?
- Is matching case-sensitive when it should not be?
- Does it anchor on a stable behaviour or a fragile string?
- Could legitimate software create the same sequence, and what context separates it?
- What would cause the rule to become silent?

Resilience is not a reason to endlessly broaden a query. Excessive generalization can erase the context that made a signal useful. The right target is a defensible set of variations, supported by test cases and documented limitations.

### Applicability and relevance

A technically sound detection may simply not apply. A rule requiring Sysmon is not deployable in a segment without Sysmon; cloud control-plane analytics have little value for an organization with no relevant cloud footprint. Review the detection against asset coverage, platform versions, data-retention windows, and the threat scenarios that matter to the organization.

Relevance should combine the threat model with opportunity. Current reporting, active exploitation, internal incidents, technology changes, and exposed business processes can all justify investment. ATT&CK mapping helps organize this work, but a technique label alone is not evidence of risk or coverage.

### Efficiency and response cost

Every detection consumes two scarce resources: platform capacity and attention. Check the query’s search scope, time window, joins, regular expressions, and scheduler cadence. Then check the expected alert experience: the fields returned, the links or pivots available, the response owner, and the likely investigation path.

A low-cost query that sends analysts a context-free alert is not efficient. Neither is an elegant, high-fidelity search that exhausts the scheduler. Quality requires both computational and human-operational fit.

## Automate the objective checks

CI cannot determine whether a detection represents a meaningful threat. It can, however, prevent a large class of avoidable mistakes. Run these checks on every change and report their results in the pull request.

| Check | What it protects | Example |
| --- | --- | --- |
| Metadata and schema validation | A complete, consistently shaped detection contract | Owner, severity, references, schedule, required fields |
| Query validation | Platform-readable syntax and dependencies | Invalid SPL or a missing macro |
| Data-contract validation | Assumptions about fields and event sources | `CommandLine` is absent after normalization |
| Fixture or replay tests | Expected matching behaviour | A known test event no longer produces a result |
| Performance guardrails | Search and scheduling capacity | A broad query exceeds its runtime budget |
| Duplicate and dependency checks | Redundant content and hidden blast radius | Two rules alert on the same evidence without distinct value |

The automation should leave an audit trail rather than become a black box. If a field check fails, show which field, source, and detection are affected. If a performance budget is exceeded, show the measured runtime and the threshold. Reviewers need enough context to decide whether the rule, the test, or the underlying telemetry contract should change.

## Measure quality in production

Pre-deployment confidence is a hypothesis. Production data tests it. Track quality at a cadence appropriate to the detection, and establish a baseline before interpreting a sudden change.

### Fidelity and dispositions

Fidelity is often described as the share of alerts that are confirmed malicious. It is a useful indicator, but not a complete verdict: benign true positives can prove that an assurance or policy detection is working, and unresolved alerts should not be counted as false positives merely to improve a dashboard.

Record dispositions with enough resolution to learn from them: confirmed malicious, expected benign, suspicious but unresolved, insufficient evidence, and false positive are more informative than a binary true/false label. Review the outcome with the detection’s stated purpose in mind.

### Volume, variance, and health

Monitor alert volume over time, along with runtime, scheduled-search delay, failures, and the health of required sources. A sharp volume drop could indicate successful tuning—or a broken data pipeline. A recurring spike could reflect a real campaign, a new business process, or duplicate telemetry.

Variance is therefore a prompt for investigation, not automatically a sign of poor quality. Compare it with known changes in telemetry, user population, deployment scope, and threat activity before altering logic.

### Tuning and misses

Tuning frequency is a valuable signal when interpreted carefully. Frequent emergency suppressions may point to weak design, while an occasional, well-documented change can reflect a healthy feedback loop. Store the reason for every material change so future engineers can distinguish threat evolution from a recurring data-quality issue.

Detection misses are especially valuable. A miss discovered during a controlled test is a chance to improve coverage with low consequence. A miss discovered during incident response deserves a blameless but rigorous review: was the behaviour in scope, did the telemetry arrive, did normalization preserve the needed fields, did the query run, and did the result reach the right consumer?

## Make context part of the detection

Metadata is not decorative. It turns a query into a maintainable security object and makes quality work scalable. Useful fields include:

```yaml
id: DET-ENDPOINT-041
intent: Detect PowerShell retrieving remote content from user workstations.
consumer: soc-alert
owner: detection-engineering
required_telemetry:
  - windows.process_creation
  - powershell.script_block
required_fields:
  - Image
  - CommandLine
  - User
quality_expectations:
  max_runtime_seconds: 90
  review_after_days: 30
triage:
  pivots:
    - parent_process
    - proxy_activity
    - dns_activity
limitations:
  - Does not cover endpoints without process command-line collection.
```

The `consumer` deserves particular care. A SOC alert, a hunting lead, a security control assurance check, and an AI-assisted triage queue can tolerate different volumes and levels of ambiguity. Define the audience before judging the signal’s precision. That prevents forcing every useful analytic into the same alert-quality standard.

## Implement a continuous detection evaluation system

The framework becomes useful when evaluation is a recurring system rather than a quarterly spreadsheet exercise. The system does not need a new platform: a scheduled SIEM job, a small data store, and a dashboard can be enough. Its job is to collect evidence for every deployed detection, compare it with expectations, and assign an explainable qualitative tag.

### 1. Create a detection inventory

Use the detection repository as the source of truth. Every deployed rule should have a stable `id`, owner, consumer, required telemetry, expected schedule, and quality expectations. Export this metadata during CI or on a scheduled job into a `detection_inventory` table or index.

Do not identify rules only by display name. Names change; a stable ID lets the evaluator join deployment data, SIEM job history, alerts, tickets, test runs, and repository changes across revisions.

```yaml
id: DET-ENDPOINT-041
owner: detection-engineering
consumer: soc-alert
required_telemetry: [windows.process_creation, powershell.script_block]
quality_expectations:
  max_runtime_seconds: 90
  max_scheduler_delay_seconds: 300
  minimum_source_health: 0.95
  review_after_days: 30
```

### 2. Collect evidence on a fixed cadence

Run a daily collector for runtime, scheduler, source-health, and alert-volume metrics. Join alert records to analyst dispositions from the ticketing or case-management system when they become available. Run a separate weekly job for slower-moving indicators such as tuning frequency, test coverage, rule-age, and open quality reviews.

```text
Detection repository ──► inventory + expectations
                                │
SIEM job history ───────────────┤
Alert and case dispositions ────┼──► quality evaluator ──► quality records + dashboard
Telemetry health checks ────────┤                                  │
CI and test results ────────────┘                                  ▼
                                                             owner notifications
```

Keep raw evidence separate from the resulting tag. This preserves the ability to revise thresholds later, and it lets an owner see *why* a detection was classified a certain way.

```json
{
  "evaluated_at": "2026-07-18T00:00:00Z",
  "detection_id": "DET-ENDPOINT-041",
  "window_days": 30,
  "alerts": 18,
  "dispositions": {
    "confirmed_malicious": 2,
    "expected_benign": 10,
    "false_positive": 3,
    "unresolved": 3
  },
  "median_runtime_seconds": 12,
  "max_scheduler_delay_seconds": 41,
  "source_health": 0.99,
  "last_passing_test": "2026-07-15T14:22:00Z"
}
```

### 3. Classify with transparent rules

Begin with a small set of qualitative tags rather than a weighted score. Use different thresholds for each consumer type, and always include a reason. For example:

| Tag | Meaning | Example rule |
| --- | --- | --- |
| `healthy` | Meets operational expectations with sufficient recent evidence | Source health and scheduler health meet target; no unresolved quality concern |
| `needs-review` | Working, but evidence suggests tuning or owner review | Alert volume changed materially; false-positive rate exceeds the team’s tolerance |
| `degraded` | A reliability dependency is failing | Required source is unhealthy, runs are skipped, or runtime exceeds the budget |
| `insufficient-evidence` | Cannot be responsibly judged yet | New rule, too few dispositions, or no valid test/replay result |
| `retire-candidate` | Value or applicability should be reassessed | Repeatedly unsupported by telemetry, superseded, or no longer relevant to the environment |

Avoid equating low alert volume with `healthy`. A silent detection with a missing data source is degraded, not quiet. Likewise, avoid penalizing an analytic that has few alerts because the underlying behaviour is rare. The evaluator should first verify that it is scheduled, its dependencies are healthy, and it has a recent test or replay result.

One simple decision order is:

```text
Required source or scheduler unhealthy?      → degraded
No recent test, too new, or too little data? → insufficient-evidence
Operational or outcome threshold exceeded?   → needs-review
Not applicable or superseded?                → retire-candidate
Otherwise                                    → healthy
```

### 4. Turn tags into owned work

Publish the current tag, its reason, and the supporting metrics to a dashboard and back into the detection catalogue. Notify the detection owner only when a tag changes, a critical dependency fails, or a review deadline is reached; alerting on every daily evaluation creates the same fatigue the system is meant to prevent.

Each non-healthy tag should have a clear next action:

- `degraded`: investigate the telemetry pipeline, parser, scheduler, or deployment before tuning the rule.
- `needs-review`: examine alert samples and dispositions; tune logic, add context, or adjust documented expectations.
- `insufficient-evidence`: run a controlled test or replay and collect enough disposition data before judging fidelity.
- `retire-candidate`: confirm the threat scenario, overlap, and data dependency with the owner before disabling or removing content.

Treat evaluation results as inputs to pull requests, not automatic production changes. A system may automatically create a review issue or open a ticket, but suppressing or rewriting a detection without human review can hide real threats.

### 5. Roll it out in stages

Start with operational health, because it is objective and useful even before disposition data is clean. Then add the more contextual indicators as your data quality improves.

1. Add stable IDs, owners, required telemetry, and basic runtime/scheduler budgets to active rules.
2. Build the daily collection job and dashboard for source health, execution health, and alert volume.
3. Standardize alert dispositions in the case-management workflow and join them to detection IDs.
4. Introduce the qualitative tags with conservative thresholds and owner-visible reasons.
5. Review tags monthly with detection engineers and SOC leads; adjust thresholds from observed reality rather than intuition.
6. Add controlled tests, replay fixtures, overlap analysis, and retirement workflows as the programme matures.

The first version should answer a narrow question reliably: *is this detection running, supported by healthy telemetry, and producing an outcome we can explain?* Expand only after that foundation is trusted.

## Improve the system, not just individual rules

The most durable quality improvements often sit outside a single query. Parser ownership, required-field monitoring, test-data curation, analyst feedback, and clear response playbooks can improve many detections at once. Conversely, no amount of tuning can rescue a rule built on telemetry that is absent, unstable, or unable to answer the investigation question.

Start small: add intent, owner, required fields, and a test to new detections; measure runtime and dispositions after release; then use the results to prioritize the next improvement. Over time, those habits create something more useful than a rule count or an ATT&CK heatmap: a detection programme whose coverage and reliability can be explained with evidence.
