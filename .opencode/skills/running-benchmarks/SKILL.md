---
name: running-benchmarks
description: Use when setting up, configuring, or executing local evaluation benchmarks on a cloned repository.
---

# Running Benchmarks

## Overview
Standardized workflow for benchmarking OpenCode agents against local repositories using predefined tickets and judge systems.

## Workflow
1. **Repository Setup**: Ensure the target repository is cloned and `REPO_PATH` in `.env` is set correctly.
2. **Environment Configuration**: Edit `.env` for model settings, timeouts, and paths.
3. **Benchmark Tickets**: Define tickets in `tickets.json` with `baseCommit` and `goldCommit`.
4. **Execution**:
   - Run all: `npm run all`
   - Run single: `npm run ticket -- <TICKET_ID>`
5. **Results**: Inspect artifacts in `runs/` for patches, logs, and judge reports.

## Checklist
- [ ] `.env` configured (REPO_PATH, MODEL, RUNS_PATH)
- [ ] `tickets.json` updated with test tickets
- [ ] Dependencies installed (`npm install`)
- [ ] Execution policy allows `npm` (run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process` if needed)

## Common Mistakes
- **Incorrect REPO_PATH**: Use absolute paths for reliability.
- **Missing Commits**: Ensure `baseCommit` and `goldCommit` exist in the target repository.
- **Model Mismatch**: Verify the model in `.env` matches the requirement (must include `opencode/` prefix).
