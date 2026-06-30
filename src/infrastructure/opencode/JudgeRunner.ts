import type { OpenCodeLogPaths, OpenCodeRunResult } from "../../domain/domain.js";
import { OpenCodeRunner } from "./OpenCodeRunner.js";

export class JudgeRunner {
  constructor(private readonly openCodeRunner: OpenCodeRunner) {}

  async judge(prompt: string, workspacePath: string, logs?: OpenCodeLogPaths): Promise<OpenCodeRunResult> {
    return this.openCodeRunner.run({
      cwd: workspacePath,
      prompt,
      logs,
    });
  }
}
