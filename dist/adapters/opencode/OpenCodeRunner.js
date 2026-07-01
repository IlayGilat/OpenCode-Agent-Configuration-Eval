import fs from "node:fs";
import path from "node:path";
export class OpenCodeRunner {
    config;
    processRunner;
    static placeholderModel = "your-provider/your-model";
    static savedLogCharacterLimit = 20_000;
    constructor(config, processRunner) {
        this.config = config;
        this.processRunner = processRunner;
    }
    async run(input) {
        if (this.config.model === OpenCodeRunner.placeholderModel) {
            throw new Error(`.env still has the placeholder model "${OpenCodeRunner.placeholderModel}". Set MODEL to a real provider/model before running solver or judge phases.`);
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
        }
        else {
            args.push(this.normalizePromptForCli(input.prompt));
        }
        const streams = input.logs ? this.openLogStreams(input.logs) : undefined;
        try {
            const result = await this.processRunner.run(this.config.opencodeCommand, args, {
                timeoutMs: this.config.timeoutMs,
                onStdout: streams ? (chunk) => this.writeChunk(streams, "stdout", chunk) : undefined,
                onStderr: streams ? (chunk) => this.writeChunk(streams, "stderr", chunk) : undefined,
                onRawOutput: streams ? (chunk) => this.writeChunk(streams, "raw", chunk) : undefined,
            });
            return {
                ...result,
                combinedOutput: [result.stdout, result.stderr ? `\n\nSTDERR:\n${result.stderr}` : ""].join(""),
            };
        }
        finally {
            streams?.raw.end();
            streams?.stdout.end();
            streams?.stderr.end();
            streams?.transcript.end();
        }
    }
    openLogStreams(paths) {
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
    writeChunk(streams, target, chunk) {
        streams[target].write(chunk);
        if (target === "raw") {
            streams.transcript.write(chunk);
            streams.onConsoleOutput?.(chunk);
        }
    }
    writePromptFile(promptPath, prompt) {
        fs.mkdirSync(path.dirname(promptPath), { recursive: true });
        fs.writeFileSync(promptPath, `${prompt.trimEnd()}\n`, "utf8");
    }
    shortMessageForPhase(phase) {
        if (phase === "judge") {
            return "Read the attached judge prompt file and return only the requested JSON.";
        }
        return "Read the attached ticket prompt file and implement the requested change.";
    }
    normalizePromptForCli(prompt) {
        return prompt.replace(/\s+/g, " ").trim();
    }
}
class CappedLogWriter {
    filePath;
    limit;
    written = 0;
    truncated = false;
    stream;
    constructor(filePath, limit, options = {}) {
        this.filePath = filePath;
        this.limit = limit;
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        this.stream = fs.createWriteStream(filePath, { flags: options.flags ?? "w" });
    }
    write(chunk) {
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
    end() {
        this.stream.end();
    }
    noteTruncated() {
        if (this.truncated) {
            return;
        }
        this.truncated = true;
        this.stream.write(`\n\n[Log truncated at ${this.limit} characters. Full output was streamed to console.]\n`);
    }
}
