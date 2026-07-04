import fs from "node:fs";
import path from "node:path";
import type { EvalConfig } from "../../interfaces/config/interfaces.js";
import type { OpenCodeLogPaths, OpenCodeRunResult } from "../../interfaces/opencode/interfaces.js";
import { ProcessRunner } from "../process/ProcessRunner.js";

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
      this.writePromptFile(input.logs.promptPath, input.prompt);
      args.push(this.shortMessageForPhase(input.logs.phase), "--file", input.logs.promptPath);
    } else {
      args.push(this.normalizePromptForCli(input.prompt));
    }

    const streams = input.logs ? this.openLogStreams(input.logs) : undefined;

    try {
      const result = await this.processRunner.run(
        this.config.opencodeCommand,
        args,
        {
          timeoutMs: this.config.timeoutMs,
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
    raw: CappedLogWriter;
    stdout: CappedLogWriter;
    stderr: CappedLogWriter;
    transcript: CappedLogWriter;
    onConsoleOutput?: (chunk: string) => void;
  } {
    fs.mkdirSync(path.dirname(paths.rawPath), { recursive: true });
    fs.mkdirSync(path.dirname(paths.transcriptPath), { recursive: true });
    const transcript = new CappedLogWriter(paths.transcriptPath, OpenCodeRunner.savedLogCharacterLimit, { flags: "a" });
    transcript.write([
      "",
      `===== OPENCODE ${paths.phase.toUpperCase()} START ${new Date().toISOString()} =====`,
      `Saved log output is capped at ${OpenCodeRunner.savedLogCharacterLimit} characters. Full output still streamed to console.`,
      "",
    ].join("\n"));

    return {
      raw: new CappedLogWriter(paths.rawPath, OpenCodeRunner.savedLogCharacterLimit),
      stdout: new CappedLogWriter(paths.stdoutPath, OpenCodeRunner.savedLogCharacterLimit),
      stderr: new CappedLogWriter(paths.stderrPath, OpenCodeRunner.savedLogCharacterLimit),
      transcript,
      onConsoleOutput: paths.onConsoleOutput,
    };
  }

  private writeChunk(
    streams: {
      raw: CappedLogWriter;
      stdout: CappedLogWriter;
      stderr: CappedLogWriter;
      transcript: CappedLogWriter;
      onConsoleOutput?: (chunk: string) => void;
    },
    target: "raw" | "stdout" | "stderr",
    chunk: string,
  ): void {
    streams[target].write(chunk);

    if (target === "raw") {
      streams.transcript.write(chunk);
      streams.onConsoleOutput?.(chunk);
    }
  }

  private writePromptFile(promptPath: string, prompt: string): void {
    fs.mkdirSync(path.dirname(promptPath), { recursive: true });
    fs.writeFileSync(promptPath, `${prompt.trimEnd()}\n`, "utf8");
  }

  private shortMessageForPhase(phase: OpenCodeLogPaths["phase"]): string {
    if (phase === "judge") {
      return "Read the attached judge prompt file and return only the requested JSON.";
    }

    return "Read the attached ticket prompt file and implement the requested change.";
  }

  private normalizePromptForCli(prompt: string): string {
    return prompt.replace(/\s+/g, " ").trim();
  }
}

class CappedLogWriter {
  private written = 0;
  private truncated = false;
  private readonly stream: fs.WriteStream;

  constructor(
    private readonly filePath: string,
    private readonly limit: number,
    options: { flags?: string } = {},
  ) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    this.stream = fs.createWriteStream(filePath, { flags: options.flags ?? "w" });
  }

  write(chunk: string): void {
    if (this.written >= this.limit) {
      this.noteTruncated();
      return;
    }

    const remaining = this.limit - this.written;
    const next = chunk.length > remaining ? chunk.slice(0, remaining) : chunk;
    this.stream.write(next);
    this.written += next.length;

    if (chunk.length > remaining) {
      this.noteTruncated();
    }
  }

  end(): void {
    this.stream.end();
  }

  private noteTruncated(): void {
    if (this.truncated) {
      return;
    }

    this.truncated = true;
    this.stream.write(`\n\n[Log truncated at ${this.limit} characters. Full output was streamed to console.]\n`);
  }
}
