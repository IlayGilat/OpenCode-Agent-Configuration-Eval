import type { Logger, LogLevel, OpenCodePhaseRunner, WorkflowTools } from "../execution/WorkflowTools.js";

export class WorkflowConsole {
  private readonly colorsEnabled = !process.env.NO_COLOR && process.env.FORCE_COLOR !== "0";
  private liveOutputNeedsNewline = false;

  constructor(private readonly logger: Logger) {}

  tools(runOpenCodeWithLogCapture: OpenCodePhaseRunner): WorkflowTools {
    return {
      runOpenCodeWithLogCapture,
      writeLiveOpenCodeOutput: this.writeLiveOpenCodeOutput.bind(this),
      logStatus: this.logStatus.bind(this),
    };
  }

  writeLiveOpenCodeOutput(chunk: string): void {
    this.liveOutputNeedsNewline = !chunk.endsWith("\n") && !chunk.endsWith("\r");
    process.stdout.write(chunk);
  }

  logStatus(level: LogLevel, label: string, message: string): void {
    this.finishLiveOutputLine();
    this.logger[level](this.formatStatusLine(level, label, message));
  }

  private finishLiveOutputLine(): void {
    if (!this.liveOutputNeedsNewline) {
      return;
    }

    process.stdout.write("\n");
    this.liveOutputNeedsNewline = false;
  }

  private formatStatusLine(level: LogLevel, label: string, message: string): string {
    return this.colorize(`[${label}] ${message}`, this.statusColor(level, label), true);
  }

  private statusColor(level: LogLevel, label: string): number {
    if (level === "error") {
      return 31;
    }

    if (level === "warn") {
      return 33;
    }

    switch (label) {
      case "RUN":
        return 36;
      case "SOLVER":
        return 35;
      case "JUDGE":
        return 34;
      case "PATCH":
        return 36;
      case "WAIT":
      case "WARN":
        return 33;
      case "OK":
      case "SCORE":
        return 32;
      case "FAIL":
        return 31;
      default:
        return 37;
    }
  }

  private colorize(value: string, colorCode: number, bold = false): string {
    if (!this.colorsEnabled) {
      return value;
    }

    const prefix = bold ? `\u001b[1;${colorCode}m` : `\u001b[${colorCode}m`;
    return `${prefix}${value}\u001b[0m`;
  }
}
