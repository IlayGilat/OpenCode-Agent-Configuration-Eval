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

