# Design: Task-Queue Persistence for Continuous Benchmarking

## Overview
To enable continuous, long-running benchmarking of opencode agents while mitigating context window accumulation, this design introduces a decoupled Task-Queue architecture. This system treats each benchmark task as an independent unit of work, ensuring a fresh agent context for every task execution.

## Architectural Components

### 1. Persistence Layer (`PersistenceProvider`)
An abstract interface to decouple the storage mechanism from the execution logic.
- **Methods:**
    - `load_tasks()`: Load pending/all tasks.
    - `save_task_result(task_id, result)`: Persist results.
    - `get_completed_tasks()`: Identify tasks already processed for resume capability.

### 2. Task Queue Manager (`BenchmarkQueue`)
Manages the orchestration of the benchmark workflow.
- Responsible for iterating through tasks provided by the `PersistenceProvider`.
- Filters out already-completed tasks to allow for seamless resumption after interruptions.

### 3. Agent Controller (`AgentOrchestrator`)
The main execution unit.
- **Responsibilities:**
    - Lifecycle management: Spawns the agent process for exactly one task, then shuts it down to release resources and clear context.
    - Execution: Invokes the task via the agent.
    - Result Handling: Collects output and passes it to the `PersistenceProvider`.

## Workflow
1. `BenchmarkQueue` initializes with a specific `PersistenceProvider`.
2. For each task found:
    a. Check if already completed via `PersistenceProvider`.
    b. If pending, `AgentOrchestrator` launches a fresh agent process.
    c. Agent executes task.
    d. `AgentOrchestrator` captures result and saves it via `PersistenceProvider`.
    e. Agent process is terminated.
3. Repeat until queue is empty.
