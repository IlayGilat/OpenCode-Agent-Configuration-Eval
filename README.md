# OpenCode Agent Eval – Monorepo

A monorepo for benchmarking AI coding agents. Uses [OpenCode](https://opencode.ai) as the runner to evaluate agents against Jira-style tickets, score the produced patches against gold-commit solutions, and generate detailed reports.

## Repository Structure

```
benchmark/                          ← monorepo root
├── packages/
│   └── benchmark/                  ← eval CLI package (@opencode-eval/benchmark)
│       ├── package.json
│       ├── tsconfig.json
│       ├── .env / .env.example
│       ├── tickets.json / tickets.example.json
│       └── src/
│           ├── adapters/           ← filesystem, git, opencode, process adapters
│           ├── cli/                ← CLI entry points (runAll, runTicket)
│           ├── composition/        ← dependency wiring (createApp)
│           ├── interfaces/         ← types & Zod schemas
│           ├── prompts/            ← solver & judge prompt templates
│           ├── services/           ← core domain services
│           ├── utils/              ← shared utilities
│           └── workflows/          ← benchmark, report, workspace workflows
├── sample-repo/                    ← sample target repo for testing
├── cloned-repo/                    ← cloned target repo for testing
├── runs/                           ← benchmark run output (gitignored)
├── docs/
├── package.json                    ← workspaces root
├── opencode.json
└── README.md
```

## Requirements

- Node.js 20+
- npm
- Git
- OpenCode CLI available on your `PATH`

## Setup

```bash
# Install all workspace dependencies
npm install

# Configure the benchmark package
cd packages/benchmark
cp .env.example .env
cp tickets.example.json tickets.json
```

Edit `.env` to configure the target repository and model. See `.env.example` for all supported settings.

Edit `tickets.json` with the benchmark tickets you want to run. Start from `tickets.example.json`.

## Configuration

`.env` supports these values:

| Name | Required | Description |
| --- | --- | --- |
| `REPO_PATH` | Yes | Path to the target repository that OpenCode should modify. Relative paths are resolved from the package root. |
| `RUNS_PATH` | Yes | Directory where run artifacts, patches, and reports are written. |
| `MODEL` | Yes | OpenCode model identifier used for the solver and judge phases. |
| `TIMEOUT_MS` | Yes | Timeout for each OpenCode invocation, in milliseconds. |
| `CONFIGURED_RUN_NAME` | No | Optional fixed run folder name. Leave unset to generate timestamped run names. |

## Commands

All commands are run from the **monorepo root** using npm workspaces:

Run all tickets:

```bash
npm run all --workspace=@opencode-eval/benchmark
```

Run a single ticket:

```bash
npm run ticket --workspace=@opencode-eval/benchmark -- FDT-001
```

Run a single ticket with a custom run name:

```bash
npm run ticket --workspace=@opencode-eval/benchmark -- FDT-001 my-run-name
```

Type-check the benchmark package:

```bash
npm run typecheck --workspace=@opencode-eval/benchmark
```

Alternatively, you can `cd packages/benchmark` and run commands directly:

```bash
cd packages/benchmark
npm run all
npm run ticket -- FDT-001
npm run typecheck
```

## Outputs

Each run is written to `runs/<run-name>/` with per-ticket artifacts and final reports in Markdown, JSON, and CSV formats.
