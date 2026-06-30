# Task 2: Implement Reporting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement exit-time reporting for context usage summary.

**Architecture:** Add a process exit handler to write current usage state to a file.

**Tech Stack:** Node.js (fs, path)

## Global Constraints

- Must not crash if token estimation fails.

---

### Task 1: Implement exit-time reporting

**Files:**
- Modify: `.opencode/plugins/context-monitor/index.ts`

**Interfaces:**
- Consumes: N/A
- Produces: `.opencode/context_usage_summary.json`

- [ ] **Step 1: Implement exit handler**

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
git add .opencode/plugins/context-monitor/index.ts
git commit -m "feat: add exit-time reporting"
```
