---
title: "Using eBPF as Behavioural Ground Truth for Threat Research and Detection Engineering"
description: "A container-scoped eBPF sensor for observing malware behaviour, probing telemetry coverage, and automating detection validation."
publishedAt: 2026-07-18
updatedAt: 2026-07-18
status: published
type: article
category: research
tags: [ebpf, container-security, telemetry, detection-engineering, threat-research, malware-ananlysis]
difficulty: intermediate
featured: false
tools: [eBPF, BCC, Python, Docker]
mitre: [T1055, T1059, T1105]
---

## Start with what happened, not just what was logged

During a malware investigation or a detection test, it is easy to mistake available telemetry for the behaviour that actually occurred. An EDR may show a process start. A container-runtime log may show an `exec` action. A network sensor may show an outbound connection. All three records are useful, but none necessarily answers the more detailed questions: did the process create an anonymous in-memory file first? Was code executed through a file descriptor? Did it write into another process? Did a memory region become executable before the connection?

This project began as a way to investigate that difference. Its purpose is not to replace an EDR or declare system logs insufficient. It is a container-scoped eBPF sensor that can serve as **behavioural ground truth** during controlled research. By observing selected syscalls close to the kernel, it gives threat researchers a lower-level account of what a workload attempted to do. Detection engineers can then compare that account with the telemetry their platform actually retained, normalized, and made searchable.

That makes the sensor useful in two related ways:

- **Threat research:** record process, memory, and network behaviour while detonating a sample or validating a proof of concept in an isolated container.
- **Detection engineering:** probe a telemetry stack before writing a rule, identify missing context or semantic differences, and turn observed behaviour into testable detection content.

The distinction matters. An absent EDR event is not automatically a product failure; the product may intentionally collect successful operations rather than syscall attempts, aggregate events, or apply policy-based filtering. The sensor gives the team a reference point for asking a more precise question: *what behaviour occurred, what did each telemetry source report, and is the retained evidence sufficient to investigate or detect it?*

## What this sensor observes

The sensor targets one Docker container at a time. It resolves the container name or ID to its cgroup, stores that cgroup ID in an eBPF map, and observes activity from processes that belong to that workload. It also follows tracked processes across forks and removes their entries at exit. This avoids collecting the same high-volume telemetry from every process on the host while retaining the process tree relevant to a detonation or test workload.

The current probes cover five behaviour classes:

| Probe | Behaviour observed | Why it is useful |
| --- | --- | --- |
| `execve` | Process execution path and first argument | Identifies process launches, including execution through `/proc/*/fd/*` |
| `connect` | IPv4 destination address and port | Associates a process with an outbound connection attempt |
| `memfd_create` | Creation of an anonymous in-memory file | Surfaces fileless staging and execution candidates |
| `mprotect` with `PROT_EXEC` | A memory region becomes executable | Highlights a common stage in in-memory execution chains |
| `process_vm_writev` | A process writes memory into another process | Captures cross-process writes that may warrant injection investigation |


None of these syscalls is malicious by itself. Browsers, language runtimes, debuggers, JITs, and legitimate administration tools can all generate some of them. Their value comes from the surrounding context and sequence. A `memfd_create` event followed by `execve` through `/proc/self/fd/3` is a much more focused hunting lead than either event in isolation. A cross-process write followed by an executable-memory transition and a new outbound connection may be worth investigating even when no single event matches a signature.

## Collection architecture: scoped kernel events, usable user-space records

At startup, the Python component calls `docker inspect`, locates the target container’s cgroup directory, and uses the directory inode as the cgroup ID. The eBPF program stores this value in `target_cgroup`. On relevant syscall tracepoints, it calls `bpf_get_current_cgroup_id()` and tracks matching PIDs. `sched_process_fork` copies that state to children, and `sched_process_exit` cleans up the PID map.

```text
Docker container name or ID
            │
            ▼
docker inspect → cgroup path → cgroup ID
            │
            ▼
target_cgroup map ──► syscall tracepoints ──► tracked PID map
                                                    │
                                                    ▼
                                                ring buffer
                                                    │
                                                    ▼
                                      Python decoder and JSON logger
                                                    │
                         ┌──────────────────────────┴──────────────────────────┐
                         ▼                                                     ▼
                   event stream                                      best-effort artifact dump
```

The kernel program does only the work that needs to happen close to the event: scope filtering, reading selected syscall arguments, and writing compact typed records to a ring buffer. The Python handler decodes those records, writes JSON to the console and `ebpf_sensor.log`, and attempts artifact extraction for file-descriptor execution and process-memory writes.

For example, a detected fileless execution can produce a record like this:

```json
{
  "timestamp": "2026-04-21T17:48:36.975077+00:00",
  "sensor_type": "ebpf_telemetry_probe",
  "event_type": "EXECVE",
  "actor": { "pid": 15990, "process_name": "fileless" },
  "details": { "true_path": "/proc/self/fd/3", "first_arg": "" },
  "fileless_payload": {
    "status": "extracted",
    "artifact_path": "/analysis/dump_memfd_15990_fd3.bin",
    "sha256": "<sha256>"
  }
}
```

There are important semantics to preserve when using this as a reference source. The current implementation instruments syscall-entry tracepoints, so it records an attempted operation rather than its return value. It captures the first argument of `execve`, not the full argument vector; `connect` is currently IPv4-only; and payload recovery is best effort. These are not reasons to discard the data. They are part of the contract that lets researchers compare it fairly with EDR, audit, and runtime events, which may represent different stages or abstractions of the same operation.

## A hands-on telemetry-probing exercise

The repository includes C samples for simple execution, `memfd`-backed fileless execution, and a controlled `process_vm_writev` memory-write scenario. Use them only in an isolated, authorized Linux lab with Docker, BCC/eBPF support, and privileges to load BPF programs and inspect `/proc`.

Start a long-running container, then attach the sensor to its cgroup:

```bash
docker run -d --name detonation_zone ubuntu:latest sleep 3600
sudo python3 sensor.py --container detonation_zone
```

The sensor confirms the resolved scope before it starts polling the ring buffer:

```text
[*] Resolved Container 'detonation_zone' -> Full ID: 5ef6c847ee77... -> Cgroup ID: 16774
[*] Compiling eBPF and tracing Cgroup ID 16774...
[*] Ring Buffer Active. Listening for events...
```

Compile a test sample on the lab host, copy it into the container, and execute it:

```bash
gcc -o 'testing samples/fileless' 'testing samples/fileless.c'
docker cp 'testing samples/fileless' detonation_zone:/tmp/fileless
docker exec detonation_zone /tmp/fileless
```

The fileless sample creates an anonymous file with `memfd_create`, writes a harmless shell-script payload to it, then executes the descriptor path. A successful probe should show a sequence similar to:

```json
{"event_type":"MEMFD_CREATE","actor":{"pid":15990,"process_name":"fileless"},"details":{"anonymous_file_name":"kthread_worker"}}
{"event_type":"EXECVE","actor":{"pid":15990,"process_name":"fileless"},"details":{"true_path":"/proc/self/fd/3","first_arg":""}}
```

This is the point at which the project becomes a telemetry-probing sensor. Capture the sensor JSON, then collect the corresponding records from the EDR, container platform, `auditd`, or host process logging. Compare the event sequence and fields rather than merely checking whether an alert appeared.

```yaml
probe:
  name: fileless-execution-via-memfd
  environment: isolated-container-lab
  expected_ground_truth:
    - MEMFD_CREATE
    - EXECVE where true_path matches /proc/*/fd/*
  compare_sources:
    - EDR process and memory telemetry
    - container runtime events
    - auditd or host process logs
  questions:
    - Is the container identity preserved?
    - Is the descriptor execution path preserved?
    - Does the source report an attempt, success, or detection?
    - Can the records be correlated by time and process context?
    - Is the behaviour rare enough in normal workloads to detect?
```

The output is more informative than a simple pass/fail. An EDR may report the process but not the descriptor-backed path. A runtime log may identify the container action but not the process-level memory behaviour. The eBPF event may show an attempted operation that a success-oriented source correctly omits. Each difference points to a collection, normalization, policy, or semantic trade-off that should be documented before a rule relies on that data.

## From a lab sensor to an automated validation stage

The sensor can be integrated into a detection and threat-research automation pipeline as a source of expected behavioural evidence. The central idea is simple: execute a controlled test, record what happened at the syscall layer, compare it with the organization’s detection telemetry, and publish the result as an artifact of the test run.

```text
Technique test or approved sample
              │
              ▼
     Ephemeral container / lab VM
              │
      ┌───────┴────────┐
      ▼                ▼
eBPF sensor        EDR / auditd / runtime telemetry
      │                │
      └───────┬────────┘
              ▼
  Normalize, enrich, and correlate
              │
              ▼
 Coverage report + detection test result
              │
      ┌───────┴────────┐
      ▼                ▼
Hunting query     Detection-content regression test
```

An implementation can use the following stages:

1. **Provision a disposable environment.** Create a dedicated test container or lab VM and attach the sensor to the target cgroup. Do not run arbitrary samples on a developer workstation or shared build host.

2. **Execute one controlled technique.** A test should have a narrow hypothesis, such as “does fileless `memfd` execution retain an execution path?” Keep the expected sequence in version control alongside the test.

3. **Collect and preserve evidence.** Save `ebpf_sensor.log`, extracted artifacts where permitted, EDR exports, runtime events, and test metadata such as image digest and kernel version.

4. **Normalize and enrich.** Add stable metadata that the raw sensor does not currently emit, including container ID, image digest, test-run ID, host identity, and collection source. Correlate with timestamps plus host PID/process context; a PID by itself is not durable across time or namespaces.

5. **Evaluate coverage.** Compare the expected ground-truth sequence with what each telemetry source retained. Produce a report for both the analytic and the investigation workflow.

6. **Gate or inform detection changes.** A detection-content pipeline can fail a regression test when a required event or field disappears, or mark a technique as partially covered when the evidence is insufficient for confident correlation.

A coverage result can be represented in JSON and stored as a CI artifact, a data-lake record, or an input to a detection-as-code repository:

```json
{
  "test_id": "fileless-memfd-execution",
  "ground_truth": ["MEMFD_CREATE", "EXECVE"],
  "observed": {
    "ebpf_sensor": ["MEMFD_CREATE", "EXECVE:/proc/self/fd/3"],
    "edr": ["PROCESS_CREATE"],
    "container_runtime": ["CONTAINER_EXEC"]
  },
  "missing_context": ["anonymous_file_name", "descriptor_execution_path"],
  "detection_readiness": "partial"
}
```

The status should describe the evidence, not grade a vendor. For example, `partial` may mean that a product recorded enough information to support a broad hunt but not enough to distinguish descriptor-backed execution from ordinary process creation. That is a useful engineering result: it tells the team whether to enrich the source, adjust the analytic, or use the sensor for targeted validation.

## What detection engineers can build from the results

The sensor’s JSON is deliberately simple to ingest into a SIEM, data lake, or research notebook. A first correlation hypothesis for fileless execution might be:

```text
same container + same PID + short time window
    MEMFD_CREATE → EXECVE(/proc/*/fd/*)
```

For a memory-write investigation, a broader research sequence might be:

```text
same container + source PID + target PID + short time window
    PROCESS_VM_WRITEV → MPROTECT_EXEC → NETWORK_CONNECT
```

These are not drop-in production detections. They are starting hypotheses that must be tested against expected workload behaviour. `mprotect(PROT_EXEC)` is often legitimate for JIT runtimes, and `process_vm_writev` requires careful context before it should be treated as injection. Baseline known-good images, retain container and orchestration metadata, measure event volume, and review analyst outcomes before promoting an idea into an alert.

For threat researchers, the same records make detonation work more repeatable. Instead of documenting that a proof of concept “ran,” the test can retain its syscall-level sequence, extracted artifact hash, target process information, and network attempts. That evidence can feed static analysis, sandboxing, hash pivoting, a behavioural knowledge base, or future detection tests.

## A complementary source, not an EDR replacement

This sensor is intentionally focused: one container scope, selected Linux syscall probes, structured logs, and best-effort artifact extraction. It is not a prevention control, a full endpoint telemetry platform, or a universal statement of maliciousness. Its value is in making the relationship between **actual workload behaviour** and **observable logging telemetry** easier to measure.

Used this way, it strengthens both sides of the pipeline. Threat researchers obtain a more detailed behavioural record from a controlled detonation. Detection engineers gain a practical method for checking whether the logging stack preserves the evidence needed for a reliable analytic. The result is not more telemetry for its own sake; it is a clearer basis for deciding what to hunt, what to detect, and where instrumentation needs to improve.
