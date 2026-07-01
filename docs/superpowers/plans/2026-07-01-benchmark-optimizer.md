# Benchmark Iteration Optimizer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an iterative benchmarking workflow that runs a suite, evaluates performance of specific "measurement" items (prompts, instructions), and keeps the best variant.

**Architecture:**
1. **Runner Script:** Orchestrate the benchmark loop (10 tickets).
2. **Measurement Swapper:** A tool that modifies configurable context files (e.g., prompts).
3. **Scorer:** Wraps existing scoring to output a machine-readable summary.
4. **Orchestrator:** Loops through predefined measurement variants.

**Tech Stack:** TypeScript (tsx), existing `benchmarkRunWorkflow`.

## Global Constraints
- Only modify "context" items that don't require restarts.
- Use existing scoring mechanic.
- Maintain compatibility with `src/cli/runAll.ts`.

---

### Task 1: Update Ticket Suite

**Files:**
- Modify: `tickets.example.json`

- [ ] **Step 1: Expand `tickets.example.json` to 10 entries**

Replace `tickets.example.json` with a list of 10 representative tickets, including valid `baseCommit` and `goldCommit` hashes.

- [ ] **Step 2: Commit**

```bash
git add tickets.example.json
git commit -m "chore: expand benchmark suite to 10 tickets"
```

### Task 2: Create Iteration Orchestrator

**Files:**
- Create: `src/cli/optimizeBenchmarks.ts`

**Interfaces:**
- Consumes: `createApp`, `benchmarkRunWorkflow`
- Produces: Final report of best-performing measurements.

- [ ] **Step 1: Scaffold orchestrator**

```typescript
// src/cli/optimizeBenchmarks.ts
import { createApp } from "../composition/createApp.js";

const variants = [
  { name: "default", apply: () => {} },
  { name: "aggressive", apply: () => { /* modify prompts/rules */ } }
];

for (const variant of variants) {
  variant.apply();
  const app = await createApp({ runName: variant.name });
  const tickets = await app.ticketLoader.loadAll();
  const scores = await app.benchmarkRunWorkflow.runAll(tickets);
  // Log scores per variant
}
```

- [ ] **Step 2: Commit**

```bash
git add src/cli/optimizeBenchmarks.ts
git commit -m "feat: add benchmark optimizer orchestrator"
```

### Task 3: Implement Measurement Swapper

**Files:**
- Create: `src/utils/measurementSwapper.ts`

- [ ] **Step 1: Write swap function**

```typescript
import fs from 'node:fs/promises';

export async function updatePrompt(newContent: string) {
  // Path to the prompt file or context item
  await fs.writeFile('./.opencode/agents/general.md', newContent);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/measurementSwapper.ts
git commit -m "feat: add measurement swapper"
```

---

Plan complete and saved to `docs/superpowers/plans/2026-07-01-benchmark-optimizer.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**