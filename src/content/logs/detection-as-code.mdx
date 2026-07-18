---
title: "Detection-as-Code: Building Systems, Not Just Rules"
description: "A practical approach to treating detections as software: explicit contracts, testable logic, controlled delivery, and feedback from production."
publishedAt: 2025-06-29
updatedAt: 2026-07-18
status: published
type: article
category: detection-engineering
tags: [detection-as-code, detection-engineering, splunk, automation, reliability]
difficulty: intermediate
featured: true
tools: [Git, GitHub Actions, Python, Splunk, SPL]
mitre: [T1059, T1105]
---

## A detection is a production system

Most security teams do not struggle because they lack another rule. They struggle because a rule depends on a system that is rarely made explicit: telemetry must arrive, fields must retain their meaning, searches must finish on time, alerts must reach the right queue, and an analyst must have enough context to decide what to do next.

That is why a detection that worked in a dashboard yesterday can still fail during an incident. A parser changes, a data source goes quiet, a macro is removed, or an otherwise sound search becomes too expensive to run at the intended cadence. The rule has not changed, but its operating environment has.

Detection-as-Code (DaC) is the discipline of treating that whole lifecycle with the same care used for production software. Detection content lives in version control, changes are reviewed, assumptions are validated, releases are deliberate, and outcomes are observed after deployment. The goal is not a perfect framework or a particular SIEM. It is a repeatable way to make detection engineering more reliable.

## Start with a contract, not a query

SPL, KQL, or another query language is only one implementation detail. Before writing it, describe what the detection needs in order to be useful. A small, structured file makes those assumptions visible to reviewers and automation.

```yaml
id: DET-ENDPOINT-041
name: PowerShell download cradle
owner: detection-engineering
status: enabled
schedule: "*/15 * * * *"
window: -20m
severity: high
telemetry:
  - windows.process_creation
required_fields:
  - Image
  - CommandLine
  - ParentImage
coverage:
  mitre_attack:
    - T1059.001
expected_outcome: true_positive_malicious_or_benign
```

The contract should answer questions that are expensive to reconstruct later:

- What behaviour is this intended to surface?
- Which telemetry and normalized fields does it rely on?
- Who owns tuning and response context?
- How often should it run, and what time range does it search?
- What does a useful result look like?

The last question is particularly important. A rule that only produces unexplained false positives is not healthy; neither is a rule that never fires because its assumptions no longer match the data. Treating benign true positives as a valid outcome creates room for assurance detections, coverage checks, and controlled tests alongside conventional malicious activity alerts.

## Separate detection content from platform configuration

Keep portable detection intent separate from the code that deploys it to a specific platform. This avoids turning every rule into a copy of vendor-specific REST parameters and makes platform changes easier to contain.

```text
detections/
  endpoint/
    powershell-download-cradle.yaml
tests/
  endpoint/
    powershell-download-cradle.test.yaml
schemas/
  detection.schema.json
scripts/
  validate_schema.py
  validate_query.py
  deploy_splunk.py
.github/workflows/
  detection-ci.yml
```

For a Splunk-backed repository, the detection file can hold the metadata and search while a deployment adapter translates it into a saved search. That adapter becomes the right place to set defaults, add deployment labels, or map common fields—not every individual rule.

```yaml
name: Suspicious PowerShell File Download
search: >
  index=windows EventCode IN (4688, 4104)
  | search Image IN ("*\\powershell.exe", "*\\pwsh.exe")
  | search CommandLine IN ("*Invoke-WebRequest*", "*DownloadFile*", "*Start-BitsTransfer*")
  | stats values(CommandLine) as command_line values(ParentImage) as parent_image by host, user, Image
cron: "*/15 * * * *"
earliest_time: -20m
latest_time: now
alert.severity: 4
risk_score: 70
```

The query is deliberately not the entire detection. The schedule, lookback, dependencies, severity, ownership, references, and tests are all part of the deployable asset.

## Test the assumptions in layers

“The query parses” is a useful check, but it is not evidence that the detection works. Effective DaC pipelines validate progressively, starting with inexpensive checks and ending with evidence from realistic telemetry.

| Layer | Question it answers | Example failure caught |
| --- | --- | --- |
| Schema | Is the detection complete and consistently shaped? | Missing owner, invalid severity, malformed schedule |
| Static query validation | Can the platform understand the query? | Broken SPL, unresolved macro, invalid field reference |
| Data contract | Are the required fields present and populated? | `CommandLine` was dropped during normalization |
| Behavioural test | Does known-good test data produce the expected result? | A renamed event ID silently prevents a match |
| Performance check | Can it run at its planned cadence and scope? | An unbounded join backs up the search queue |
| Deployment check | Did the exact reviewed revision reach the target? | A rule deploys disabled or with a stale schedule |

The strongest tests come from controlled activity in a lab: execute the behaviour, collect the resulting telemetry, and confirm that the detection sees it. When that is not available, curated historical events and carefully constructed fixtures are still valuable. They catch regressions in field names, query logic, and expected result shape without asking production analysts to discover mistakes for you.

Here is the shape of a simple behavioural fixture:

```yaml
rule: DET-ENDPOINT-041
events: fixtures/powershell-download.jsonl
expect:
  minimum_results: 1
  fields:
    - host
    - user
    - command_line
  contains:
    command_line: Invoke-WebRequest
```

Use fixtures sparingly and keep their provenance clear. Synthetic data is excellent for testing logic, but it cannot prove that the required telemetry exists in every production segment. That is a separate, continuous control.

## Deliver changes as an engineering workflow

A practical pipeline does not need to begin with a large internal platform. A pull-request workflow is enough to establish the important controls:

```text
Change detection content
        │
        ▼
schema + formatting checks
        │
        ▼
query, field, and fixture tests
        │
        ▼
peer review and approval
        │
        ▼
deploy to staging
        │
        ▼
release to production with revision metadata
        │
        ▼
observe volume, latency, and analyst outcomes
```

GitHub Actions, GitLab CI, Jenkins, or a similar runner can execute the mechanics. The design matters more than the product: validate only the changed detections where possible, protect deployment credentials in the CI secret store, and make production deployment a distinct, auditable action.

Avoid running sensitive deployment jobs on untrusted pull-request code. In particular, self-hosted runners should be isolated and used only with workflows where repository and contributor trust are carefully controlled. The deployment identity should have only the permissions needed to manage detection content—not broad administrative access to the SIEM.

## Treat production feedback as a test result

Deploying a detection is the start of its operational life, not the end of the work. Monitor the signals that reveal whether its assumptions remain true:

- alert volume and distribution by source, host, and business unit;
- query runtime, skipped runs, and scheduler delay;
- ingestion or parser health for required sources and fields;
- analyst dispositions, escalation rate, and time-to-triage;
- coverage gaps where expected tests ran but no supporting telemetry arrived.

These measures turn tuning from subjective debate into an evidence-driven decision. A sudden reduction in volume may be a welcome improvement, a broken parser, or a logging policy change. Without a baseline and ownership, those outcomes are indistinguishable.

The same feedback should feed the repository. Capture an explanation when a threshold changes, preserve a regression fixture when an incident teaches something new, and deprecate rules whose telemetry is no longer available or whose value is consistently low. Version control gives a history of edits; an operational feedback loop gives those edits meaning.

## Build for your environment

There is no universal DaC maturity model. A small team may begin with YAML files, pull-request review, and a schema validator. A larger programme might add a staging SIEM, adversary-emulation tests, detection health dashboards, and automated change promotion. Both are valid if the practices reduce uncertainty around detection changes.

The useful progression is simple:

1. Make detection assumptions explicit.
2. Store and review changes as code.
3. Test against data, not just syntax.
4. Release predictably and retain traceability.
5. Measure what happens after deployment.

Reliable detection engineering is not about writing flawless queries. It is about building a system in which detections can be understood, challenged, improved, and recovered when the environment changes.
