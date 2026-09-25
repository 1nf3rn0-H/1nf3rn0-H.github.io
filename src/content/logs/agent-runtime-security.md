---
title: "Agent Runtime Security: Enforcing Policy Before AI Agents Execute"
description: "Why I built a deterministic local control that evaluates AI-agent tool requests before they become shell, file, package, or MCP side effects."
publishedAt: 2026-09-25
updatedAt: 2026-09-25
status: published
type: research-note
category: ai-security
tags: [ai-agents, runtime-security, codex, policy-engine, detection-engineering]
difficulty: advanced
featured: true
tools: [Python, Codex Hooks, ARSQuery, JSON Schema]
platforms: [macOS, Codex]
repository: "https://github.com/1nf3rn0-H/agent-runtime-security"
---

## The problem I kept seeing

While experimenting with coding agents, I kept returning to an uncomfortable gap. The security tools around the process could tell me that a shell started, a file changed, or a connection was attempted. That evidence was useful, but it arrived after the agent's proposal had already crossed into execution.

The agent harness knew more, and it knew it earlier. Before starting a process or calling an integration, it held the exact structured tool request the model wanted to run. Yet most of the controls I was looking at treated that moment as telemetry rather than as an enforcement boundary.

That felt familiar from detection engineering. Observability helps us reconstruct what happened; prevention requires a trustworthy decision point before the side effect. I wanted to know whether that principle could be applied locally to an AI coding agent without putting another probabilistic model, a remote service, or a large security platform in the critical path.

That question became **Agent Runtime Security**: can a small deterministic control evaluate the exact action proposed by an agent and reject it before the harness dispatches the tool?

The motivation was not that endpoint detection and response had become irrelevant, or that every unexpected agent action was malicious. It was that model mistakes, poisoned context, unsafe dependencies, and deliberately manipulated models can all converge on the same thing: a dangerous tool request. If the harness exposes that request synchronously, it is worth testing whether policy can stop it there.

[Agent Runtime Security](https://github.com/1nf3rn0-H/agent-runtime-security) is the resulting `0.3.0-alpha` research prototype. It integrates with Codex lifecycle hooks, normalizes tool requests, interprets shell structure without executing it, compiles readable ARSQuery rules into bounded runtime IR, returns a harness-native deny, propagates correlation context through allowed subprocesses, and persists detections rather than exporting every raw observation. It is deliberately an application-level enforcement layer, not an endpoint detection and response system for agents.

On my local Apple-silicon test host, five independent benchmark processes evaluating 500 samples each produced a median p95 of **1.185 ms** for a worst-case non-match across 1,000 rules. A network-target regex workload produced a median p95 of **0.064 ms**. Every measured policy-engine workload remained below the project's provisional 10 ms p95 engine budget. These are component microbenchmarks and not production latency or proof of security effectiveness.

## Why this boundary matters

The dangerous transition in an agent system is not token generation. It is the moment an untrusted proposal becomes an authorized side effect.

Consider a model that proposes:

```sh
ping evil.com
```

A log pipeline can record that command. An EDR may observe the resulting process. A SIEM rule may alert on the destination. Each is useful, but each may occur after process creation. The application harness has an earlier and more precise object: the structured tool request it is about to dispatch.

Agent Runtime Security therefore treats the preventive hook as a local reference monitor:

```text
decision = f(normalized proposed action, local context, validated policy)
```

For the same inputs and policy, `f` must return the same result. It must not call a model, depend on a data lake, or wait for a remote service on the baseline decision path. If the decision is `deny`, the command must never reach the terminal process.

The control is agnostic to why an unsafe action was proposed. Backdoored or tampered model weights, poisoned retrieval, prompt injection, a compromised dependency, and an ordinary model mistake can all produce the same dangerous tool request. NIST's adversarial-ML taxonomy recognizes model poisoning and trigger-specific backdoor behavior, while its generative-AI secure-development profile identifies model weights and related artifacts as integrity-sensitive supply-chain components [4][5]. Proof-of-concept sleeper-agent research has also shown that trigger-dependent unsafe code generation can persist through common safety-training techniques [6]. These results establish a plausible threat class, not evidence that a particular production model is compromised.

This design is influenced by two complementary lines of work.

First, Uber's **ADR: An Agentic Detection System for Enterprise Agentic AI Security** establishes a broad architecture for agent discovery, normalized telemetry, detection, benchmarking, and prevention. Its published evaluation reports deployment across more than 7,200 hosts and 10,000 daily sessions, 97.2% precision in production detections, and an ADR-Bench evaluation spanning 302 tasks, 17 attack techniques, and 133 MCP servers [1]. Agent Runtime Security takes direct inspiration from ADR's causal telemetry, cross-harness normalization, and evidence-driven evaluation. My narrower research target is the local synchronous enforcement path.

Second, Alex Beaver's essay **The Asymptote of the AI SOC is Determinism** argues that AI reduces the up-front cost of building deterministic automation while repeatable deterministic systems retain advantages in marginal cost, testing, debugging, and auditability [2]. That framing strongly influenced this project: use agents where language and open-ended reasoning are valuable, but keep a frequent, safety-critical allow/deny path small, typed, and deterministic.

## What I wanted to learn

The prototype is organized around four falsifiable questions:

1. **Prevention:** Can a policy denial stop a supported tool action before any child process or integration is invoked?
2. **Interpretation:** Can useful command semantics be extracted without evaluating shell code or trusting raw text matching alone?
3. **Correlation:** Can one trace connect a session, subagents, tool calls, and ordinary descendant processes without turning correlation tokens into credentials?
4. **Cost:** Can a bounded local rule engine remain comfortably inside a 10 ms p95 budget at the supported 1,000-rule limit?

The current answer is promising but intentionally scoped. The Codex adapter demonstrates the contracts; it is not yet an operating-system security boundary or a production claim across all agent harnesses.

## System design

### Control and data flow

```text
model proposal
    → Codex harness
    → PreToolUse adapter
    → normalized action
    → non-executing parser and target extraction
    → validated local policy
        ├─ deny  → native hook denial → detection evidence
        └─ allow → trace injection → normal permission flow → execution
```

The ordering is a security property. Policy evaluation runs against the original request. Trace injection occurs only after an allow decision. A denied action receives no executable rewrite and never crosses the dispatch boundary.

Codex currently exposes preventive lifecycle events for supported local tool calls. Agent Runtime Security registers wildcard `PreToolUse` and `PermissionRequest` handlers, plus observational lifecycle handlers. The adapter returns the response shape expected by each event. It never auto-approves a permission request; an allow leaves Codex's normal user-approval flow intact.

### From text to semantics

Matching the raw substring `evil.com` would also block harmless commands such as:

```sh
printf '%s\n' evil.com
```

The prototype instead parses a bounded subset of shell structure and extracts typed targets. The example policy constrains three facts to the same proposed invocation:

```text
DEFAULT ALLOW

RULE block-ping-evil-domain
WHEN tool.name IS "Bash"
AND process.executable IS ["ping", "ping6"]
AND network.destinations MATCHES "^evil\\.com$"
THEN DENY "Blocked by Agent Runtime Security policy."
END
```

ARSQuery is compiled ahead of time. The compiler validates fields, types, operator compatibility, regular expressions, duplicate identifiers, and resource limits, then emits versioned JSON IR. The inline hook reads the IR; it does not parse the authoring language at decision time.

Most rules need only:

- `IS` for exact scalar membership or list intersection;
- `CONTAINS` for literal substring matching;
- `MATCHES` for regular expressions; and
- `EXISTS` / `NOT_EXISTS` for presence semantics.

Matching is case-insensitive by default and can be made case-sensitive per rule. Exact and literal operators are preferred when regex expressiveness is unnecessary. Any matching deny wins, otherwise a matching allow wins, otherwise the policy default applies; audit matches do not change the decision.

### Execution-chain correlation

Allowed shell commands receive environment-carried correlation values for the session, actor, vendor session, tool call, and exact action lifecycle. Normal child, grandchild, background, and detached processes inherit these values through ordinary process semantics.

```text
agent session / trace ID
    ├─ root actor
    │   └─ tool call / action ID → shell → child → grandchild
    └─ subagent actor
        └─ tool call / action ID → subagent process
```

These values are correlation hints, not identity proofs. A process can read, delete, or replace its environment. Raw trace and actor tokens are therefore never written to detection events; only identifiers and token fingerprints are retained. Strong process attribution will require an endpoint sensor that joins these hints with UID, PID, PPID, process start time, executable identity, and platform process lineage.

### Detection-only durable telemetry

The contract deliberately does not stream every raw hook observation to a SIEM or data lake. Raw observations may exist in a bounded local diagnostic path during the prototype, but durable log output is created only when a rule matches.

A schema-v1.2 detection contains:

- rule identity, severity, confidence, and category;
- session, trace, actor, tool-call, action, and request correlations;
- minimized entities and directed relationships;
- bounded evidence and an ordered evidence chain; and
- the response, enforcement point, and decision reason.

For a pre-execution denial, the evidence graph records intent rather than claiming a side effect occurred:

```text
agent actor → initiated → tool call
tool call   → proposed  → ping process
tool call   → targeted  → evil.com
policy evidence supports the tool call and target
blocked response is applied at the tool-call boundary
```

This distinction matters. A proposed connection is not an observed connection, and a post-execution alert cannot be represented as preventive enforcement.

### Deterministic enforcement

Agent Runtime Security controls the action object that a supported harness exposes before dispatch. It does not claim to understand or mediate every side effect that may later occur inside an allowed process.

```text
backdoored model ─┐
poisoned context ─┼→ agent harness → proposed action → Agent Runtime Security
ordinary mistake ─┘                                  ├─ deny  → no dispatch
                                                    └─ allow → process or integration
                                                                  ↓
                                                     sandbox, firewall, or EDR
```

This creates a precise division of responsibility:

| In the Agent Runtime Security boundary | Outside the boundary |
|---|---|
| Supported shell, file-edit, MCP, package, and delegation requests surfaced by the harness | Arbitrary behavior inside an already allowed Python, Node, native, or dependency process |
| Deterministic policy over the exact proposed action and normalized context | Complete process, socket, kernel, and filesystem monitoring |
| Native pre-execution allow or deny response | Host firewalling, sandboxing, malware analysis, and endpoint containment |
| Session, actor, tool-call, and subprocess correlation hints | Verified process identity and complete PID/PPID lineage |
| Detection evidence for policy matches and enforcement results | Attribution of malicious intent to model weights or software suppliers |

For example, a compromised model could respond to “build a DNS test in Python” by embedding an attacker-selected IP address instead of an approved resolver. If it proposes a direct, supported network command and the destination is visible in the tool request, a suitable rule can block it. If it writes the IP inside Python source and later proposes only `python3 dns_test.py`, the current hook sees the file operation and interpreter launch, not the future socket destination. A compromised imported library may perform the network action without producing another harness tool call at all.

That is not a reason to turn Agent Runtime Security into an EDR. It is a reason to make the claim narrow and composable: treat the model and its generated actions as untrusted, enforce deterministically where the harness provides a synchronous boundary, and hand allowed execution to existing sandbox, network, and endpoint controls. Trace propagation helps those controls correlate activity; it does not expand the hook into an operating-system reference monitor.

## Current evidence and scope

At `0.3.0-alpha`, the prototype has 112 automated tests and a safe end-to-end sentinel test showing that a denied command never reaches execution; in five local benchmark runs, a worst-case non-match across 1,000 rules produced a median p95 of **1.185 ms**, while the network-target regex path produced **0.064 ms**, both within the provisional 10 ms engine budget. Those numbers measure the policy component rather than full harness latency or security effectiveness, and the control remains limited to supported actions exposed through Codex hooks; it cannot see arbitrary behavior hidden inside an allowed process, replace host sandboxing or EDR, or provide strong process identity from environment-carried trace values alone. The complete test commands, benchmark implementation, parser boundaries, policy lifecycle, and roadmap are maintained in the [project repository](https://github.com/1nf3rn0-H/agent-runtime-security); the result that matters here is narrower: the harness still has enough context and authority to make a deterministic decision before intent becomes a side effect.

## References

1. Li, C. et al. [“ADR: An Agentic Detection System for Enterprise Agentic AI Security.”](https://arxiv.org/abs/2605.17380) *MLSys 2026 Industry Track*, 2026. Open-source artifacts: [Uber/ADR](https://github.com/uber/ADR).
2. Beaver, A. [“The Asymptote of the AI SOC is Determinism.”](https://secureatscale.com/posts/ai-soc-asymptote) *Secure at Scale*, September 22, 2026.
3. Agent Runtime Security. [Project source and reproducibility materials](https://github.com/1nf3rn0-H/agent-runtime-security), 2026.
4. Vassilev, A. et al. [“Adversarial Machine Learning: A Taxonomy and Terminology of Attacks and Mitigations.”](https://doi.org/10.6028/NIST.AI.100-2e2025) NIST AI 100-2e2025, March 2025.
5. Booth, H. et al. [“Secure Software Development Practices for Generative AI and Dual-Use Foundation Models.”](https://doi.org/10.6028/NIST.SP.800-218A) NIST SP 800-218A, July 2024.
6. Hubinger, E. et al. [“Sleeper Agents: Training Deceptive LLMs that Persist Through Safety Training.”](https://www.anthropic.com/research/sleeper-agents-training-deceptive-llms-that-persist-through-safety-training) Anthropic, January 2024.
