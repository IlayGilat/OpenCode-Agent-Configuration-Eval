import fs from "node:fs";
import path from "node:path";
import type { EvalConfig, OpenCodeLogPaths, OpenCodeRunResult } from "../../domain/domain.js";
import { ProcessRunner } from "../process/ProcessRunner.js";

export class OpenCodeRunner {
  constructor(
    private readonly config: EvalConfig,
    private readonly processRunner: ProcessRunner,
  ) {}

  async run(input: { cwd: string; prompt: string; logs?: OpenCodeLogPaths }): Promise<OpenCodeRunResult> {
    const args = [
      "run",
      "--dir",
      input.cwd,
      "--format",
      "json",
      "--print-logs",
    ];

    if (this.config.model && this.config.model !== "your-provider/your-model") {
      args.push("--model", this.config.model);
    }

    args.push(input.prompt);

    const streams = input.logs ? this.openLogStreams(input.logs) : undefined;

    try {
      const result = await this.processRunner.run(
        this.config.opencodeCommand,
        args,
        {
          timeoutMs: this.config.timeoutMinutes * 60 * 1000,
          onStdout: streams ? (chunk) => streams.stdout.write(chunk) : undefined,
          onStderr: streams ? (chunk) => streams.stderr.write(chunk) : undefined,
          onRawOutput: streams ? (chunk) => streams.raw.write(chunk) : undefined,
        },
      );

      return {
        ...result,
        combinedOutput: [result.stdout, result.stderr ? `\n\nSTDERR:\n${result.stderr}` : ""].join(""),
      };
    } finally {
      streams?.raw.end();
      streams?.stdout.end();
      streams?.stderr.end();
    }
  }

  private openLogStreams(paths: OpenCodeLogPaths): {
    raw: fs.WriteStream;
    stdout: fs.WriteStream;
    stderr: fs.WriteStream;
  } {
    fs.mkdirSync(path.dirname(paths.rawPath), { recursive: true });

    return {
      raw: fs.createWriteStream(paths.rawPath, { flags: "w" }),
      stdout: fs.createWriteStream(paths.stdoutPath, { flags: "w" }),
      stderr: fs.createWriteStream(paths.stderrPath, { flags: "w" }),
    };
  }
}
