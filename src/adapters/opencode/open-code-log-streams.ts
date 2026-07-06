import fs from "node:fs";
import path from "node:path";
import type { OpenCodeLogPaths } from "../../interfaces/opencode/interfaces.js";

export type ActiveOpenCodeLogStreams = {
  raw: CappedLogWriter;
  stdout: CappedLogWriter;
  stderr: CappedLogWriter;
  transcript: CappedLogWriter;
  onConsoleOutput?: (chunk: string) => void;
};

export function openOpenCodeLogStreams(
  paths: OpenCodeLogPaths,
  savedLogCharacterLimit: number,
): ActiveOpenCodeLogStreams {
  fs.mkdirSync(path.dirname(paths.rawPath), { recursive: true });
  fs.mkdirSync(path.dirname(paths.transcriptPath), { recursive: true });
  const transcript = new CappedLogWriter(paths.transcriptPath, savedLogCharacterLimit, { flags: "a" });
  transcript.write([
    "",
    `===== OPENCODE ${paths.phase.toUpperCase()} START ${new Date().toISOString()} =====`,
    `Saved log output is capped at ${savedLogCharacterLimit} characters. Full output still streamed to console.`,
    "",
  ].join("\n"));

  return {
    raw: new CappedLogWriter(paths.rawPath, savedLogCharacterLimit),
    stdout: new CappedLogWriter(paths.stdoutPath, savedLogCharacterLimit),
    stderr: new CappedLogWriter(paths.stderrPath, savedLogCharacterLimit),
    transcript,
    onConsoleOutput: paths.onConsoleOutput,
  };
}

export function writeOpenCodeLogChunk(
  streams: ActiveOpenCodeLogStreams,
  target: "raw" | "stdout" | "stderr",
  chunk: string,
): void {
  streams[target].write(chunk);

  if (target === "raw") {
    streams.transcript.write(chunk);
    streams.onConsoleOutput?.(chunk);
  }
}

export function closeOpenCodeLogStreams(streams: ActiveOpenCodeLogStreams): void {
  streams.raw.end();
  streams.stdout.end();
  streams.stderr.end();
  streams.transcript.end();
}

export class CappedLogWriter {
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
