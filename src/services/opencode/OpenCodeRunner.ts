import fs from "node:fs";
import path from "node:path";
import type { EvalConfig } from "../../interfaces/config/interfaces.js";
import type { OpenCodeLogPaths, OpenCodeRunResult } from "../../interfaces/opencode/interfaces.js";
import { ProcessRunner } from "../system/ProcessRunner.js";

export class OpenCodeRunner {
  private static readonly placeholderModel = "your-provider/your-model";

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

    args.push(this.normalizePromptForCli(input.prompt));

    const streams = input.logs ? this.openLogStreams(input.logs) : undefined;

    try {
      const result = await this.processRunner.run(
        this.config.opencodeCommand,
        args,
        {
          timeoutMs: this.config.timeoutMinutes * 60 * 1000,
          onStdout: streams ? (chunk) => this.writeChunk(streams, "stdout", chunk) : undefined,
          onStderr: streams ? (chunk) => this.writeChunk(streams, "stderr", chunk) : undefined,
          onRawOutput: streams ? (chunk) => this.writeChunk(streams, "raw", chunk) : undefined,
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
      streams?.transcript.end();
    }
  }

  private openLogStreams(paths: OpenCodeLogPaths): {
    raw: fs.WriteStream;
    stdout: fs.WriteStream;
    stderr: fs.WriteStream;
    transcript: fs.WriteStream;
  } {
    fs.mkdirSync(path.dirname(paths.rawPath), { recursive: true });
    fs.mkdirSync(path.dirname(paths.transcriptPath), { recursive: true });
    const transcript = fs.createWriteStream(paths.transcriptPath, { flags: "a" });
    transcript.write([
      "",
      `===== OPENCODE ${paths.phase.toUpperCase()} START ${new Date().toISOString()} =====`,
      `Raw terminal/log stream for this ${paths.phase} run is appended below.`,
      "",
    ].join("\n"));

    return {
      raw: fs.createWriteStream(paths.rawPath, { flags: "w" }),
      stdout: fs.createWriteStream(paths.stdoutPath, { flags: "w" }),
      stderr: fs.createWriteStream(paths.stderrPath, { flags: "w" }),
      transcript,
    };
  }

  private writeChunk(
    streams: {
      raw: fs.WriteStream;
      stdout: fs.WriteStream;
      stderr: fs.WriteStream;
      transcript: fs.WriteStream;
    },
    target: "raw" | "stdout" | "stderr",
    chunk: string,
  ): void {
    streams[target].write(chunk);

    if (target === "raw") {
      streams.transcript.write(chunk);
    }
  }

  private normalizePromptForCli(prompt: string): string {
    return prompt.replace(/\s+/g, " ").trim();
  }
}
