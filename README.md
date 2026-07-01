# OpenCode Local Agent Eval

A small TypeScript CLI for running OpenCode against a set of benchmark tickets, collecting patches, judging results, and writing reports for each run.

The project reads tickets from `tickets.json`, prepares the configured target repository at each ticket's base commit, runs OpenCode with the solver prompt, judges the produced patch, and writes run artifacts under `runs/`.

## Requirements

- Node.js 20+
- npm
- Git
- OpenCode CLI available on your `PATH`

## Setup

```bash
npm install
cp .env.example .env
cp tickets.example.json tickets.json
```

Edit `.env` to point at the repository you want to evaluate. The example file documents every supported setting:

```bash
REPO_PATH=./sample-repo
RUNS_PATH=./runs
MODEL=opencode/deepseek-v4-flash-free
TIMEOUT_MS=3600000
```

Edit `tickets.json` with the benchmark tickets you want to run. You can start from `tickets.example.json` and replace the sample tickets with your own.

## Configuration

`.env` supports these values:

| Name | Required | Description |
| --- | --- | --- |
| `REPO_PATH` | Yes | Path to the target repository that OpenCode should modify. Relative paths are resolved from this project root. |
| `RUNS_PATH` | Yes | Directory where run artifacts, patches, logs, and reports are written. |
| `MODEL` | Yes | OpenCode model identifier used for the solver and judge phases. |
| `TIMEOUT_MS` | Yes | Timeout for each OpenCode invocation, in milliseconds. |
| `CONFIGURED_RUN_NAME` | No | Optional fixed run folder name. Leave unset to generate timestamped run names. |

`tickets.json` must be a JSON array. Each ticket has this shape:

```json
[
  {
    "id": "PROJECT-001",
    "title": "Short, human-readable ticket title",
    "description": "Clear task description with reproduction details and expected behavior.",
    "baseCommit": "0123456789abcdef0123456789abcdef01234567",
    "goldCommit": "fedcba9876543210fedcba9876543210fedcba98"
  }
]
```

The `baseCommit` is the commit checked out before the agent starts work. The `goldCommit` is the reference solution used by the judge.

## Commands

Run all tickets:

```bash
npm run all
```

Run a single ticket:

```bash
npm run ticket -- FDT-001
```

Run a single ticket with a custom run name:

```bash
npm run ticket -- FDT-001 my-run-name
```

Type-check the project:

```bash
npm run typecheck
```

## Outputs

Each run is written to `runs/<run-name>/` with per-ticket artifacts and final reports in Markdown, JSON, and CSV formats.
