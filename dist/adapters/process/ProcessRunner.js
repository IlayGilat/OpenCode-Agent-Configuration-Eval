import { execa } from "execa";
export class ProcessRunError extends Error {
    result;
    constructor(message, result) {
        super(message);
        this.result = result;
    }
}
export class ProcessRunner {
    async run(command, args, options = {}) {
        try {
            const subprocess = execa(command, args, {
                cwd: options.cwd,
                timeout: options.timeoutMs,
                reject: true,
                all: true,
                stdin: "ignore",
            });
            subprocess.stdout?.on("data", (chunk) => {
                options.onStdout?.(chunk.toString());
            });
            subprocess.stderr?.on("data", (chunk) => {
                options.onStderr?.(chunk.toString());
            });
            subprocess.all?.on("data", (chunk) => {
                options.onRawOutput?.(chunk.toString());
            });
            const result = await subprocess;
            return {
                stdout: result.stdout,
                stderr: result.stderr,
                rawOutput: result.all ?? [result.stdout, result.stderr].filter(Boolean).join("\n"),
            };
        }
        catch (error) {
            const execaError = error;
            const details = [
                `Command failed: ${command} ${args.join(" ")}`,
                execaError.shortMessage,
                execaError.stdout ? `STDOUT:\n${execaError.stdout}` : "",
                execaError.stderr ? `STDERR:\n${execaError.stderr}` : "",
                execaError.all ? `RAW:\n${execaError.all}` : "",
            ].filter(Boolean);
            const stdout = this.outputToString(execaError.stdout);
            const stderr = this.outputToString(execaError.stderr);
            const rawOutput = this.outputToString(execaError.all) || [stdout, stderr].filter(Boolean).join("\n");
            throw new ProcessRunError(details.join("\n\n"), {
                stdout,
                stderr,
                rawOutput,
            });
        }
    }
    outputToString(value) {
        if (typeof value === "string") {
            return value;
        }
        if (value instanceof Uint8Array) {
            return new TextDecoder().decode(value);
        }
        if (Array.isArray(value)) {
            return value.map((item) => this.outputToString(item)).join("");
        }
        return "";
    }
}
