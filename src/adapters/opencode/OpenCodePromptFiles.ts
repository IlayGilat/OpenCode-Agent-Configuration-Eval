import fs from "node:fs";
import path from "node:path";
import type { OpenCodeLogPaths } from "../../interfaces/opencode/interfaces.js";

export function writePromptFile(promptPath: string, prompt: string): void {
  fs.mkdirSync(path.dirname(promptPath), { recursive: true });
  fs.writeFileSync(promptPath, `${prompt.trimEnd()}\n`, "utf8");
}

export function shortMessageForPhase(phase: OpenCodeLogPaths["phase"]): string {
  if (phase === "judge") {
    return "Read the attached judge prompt file and return only the requested JSON.";
  }

  return "Read the attached ticket prompt file and implement the requested change.";
}

export function normalizePromptForCli(prompt: string): string {
  return prompt.replace(/\s+/g, " ").trim();
}
