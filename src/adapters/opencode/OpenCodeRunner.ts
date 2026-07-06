import type { EvalConfig } from "../../interfaces/config/interfaces.js";
import type { OpenCodeLogPaths, OpenCodeRunResult } from "../../interfaces/opencode/interfaces.js";
import { ProcessRunner } from "../process/ProcessRunner.js";
import {
  closeOpenCodeLogStreams,
  openOpenCodeLogStreams,
  writeOpenCodeLogChunk,
} from "./OpenCodeLogStreams.js";
import {
  normalizePromptForCli,
  shortMessageForPhase,
  writePromptFile,
} from "./OpenCodePromptFiles.js";

export class OpenCodeRunner {
  private static readonly placeholderModel = "your-provider/your-model";
  private static readonly savedLogCharacterLimit = 20_000;

  constructor(
    private readonly config: EvalConfig,
    private readonly processRunner: ProcessRunner,
  ) {}

  async run(input: { cwd: string; prompt: string; logs?: OpenCodeLogPaths }): Promise<OpenCodeRunResult> {
    if (this.config.model === OpenCodeRunner.placeholderModel) {
      throw new Error(
        `.env still has the placeholder model "${OpenCodeRunner.placeholderModel}". Set MODEL to a real provider/model before running solver or judge phases.`,
      );
    }

    const args = [
      "run",
      "--dir",
      input.cwd,
      "--format",
      "default",
      "--print-logs",
      "--dangerously-skip-permissions",
      "--model",
      this.config.model,
    ];

    if (input.logs) {
      writePromptFile(input.logs.promptPath, input.prompt);
      args.push(shortMessageForPhase(input.logs.phase), "--file", input.logs.promptPath);
    } else {
      args.push(normalizePromptForCli(input.prompt));
    }

    const streams = input.logs ? openOpenCodeLogStreams(input.logs, OpenCodeRunner.savedLogCharacterLimit) : undefined;

    try {
      const result = await this.processRunner.run(
        this.config.opencodeCommand,
        args,
        {
          timeoutMs: this.config.timeoutMs,
          onStdout: streams ? (chunk) => writeOpenCodeLogChunk(streams, "stdout", chunk) : undefined,
          onStderr: streams ? (chunk) => writeOpenCodeLogChunk(streams, "stderr", chunk) : undefined,
          onRawOutput: streams ? (chunk) => writeOpenCodeLogChunk(streams, "raw", chunk) : undefined,
        },
      );

      return {
        ...result,
        combinedOutput: [result.stdout, result.stderr ? `\n\nSTDERR:\n${result.stderr}` : ""].join(""),
      };
    } finally {
      if (streams) {
        closeOpenCodeLogStreams(streams);
      }
    }
  }
}
