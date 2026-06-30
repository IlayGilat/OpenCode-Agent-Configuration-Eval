# Context Monitor Plugin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a plugin that tracks token usage per category (history, file reads, tool outputs) and saves a summary on exit.

**Architecture:** A TypeScript-based plugin that uses `opencode` hooks to intercept interaction data and estimate token usage.

**Tech Stack:** TypeScript, `opencode` plugin API.

## Global Constraints
- Plugin must be registered under `.opencode/plugins/context-monitor/`.
- Must export a default function matching the `Plugin` type.
- Must not crash if token estimation fails (graceful degradation).

---

### Task 1: Scaffolding

**Files:**
- Create: `.opencode/plugins/context-monitor/index.ts`
- Create: `.opencode/plugins/context-monitor/package.json`

- [ ] **Step 1: Create index.ts**

```typescript
import type { Plugin } from "@opencode-ai/plugin";
import fs from "fs";
import path from "path";

const usage = {
  chat_history: 0,
  tool_outputs: 0,
  file_reads: 0,
  system: 0
};

export default (async () => {
  return {
    "chat.message": async (input) => {
        // Simple heuristic for estimation
        const text = input.message.content || "";
        usage.chat_history += text.length / 4; 
    },
    "tool.execute.after": async (input, output) => {
        const text = JSON.stringify(output.result) || "";
        usage.tool_outputs += text.length / 4;
    }
  };
}) satisfies Plugin;
```

- [ ] **Step 2: Commit**

```bash
git add .opencode/plugins/context-monitor/
git commit -m "feat: scaffold context monitor plugin"
```

### Task 2: Implement Reporting

**Files:**
- Modify: `.opencode/plugins/context-monitor/index.ts`

- [ ] **Step 1: Add exit-time reporting**

```typescript
// Add to index.ts
process.on('exit', () => {
    fs.writeFileSync(
        path.join(process.cwd(), '.opencode', 'context_usage_summary.json'),
        JSON.stringify(usage, null, 2)
    );
});
```

- [ ] **Step 2: Commit**

```bash
git commit -am "feat: add exit-time reporting"
```
