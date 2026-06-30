import type { Plugin } from "@opencode-ai/plugin";

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
        try {
            const text = input.message.content || "";
            usage.chat_history += text.length / 4; 
        } catch (e) {
            // Silently ignore errors
        }
    },
    "tool.execute.after": async (input, output) => {
        try {
            const text = JSON.stringify(output.result) || "";
            usage.tool_outputs += text.length / 4;
        } catch (e) {
            // Silently ignore errors
        }
    }
  };
}) satisfies Plugin;
