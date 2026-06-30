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

