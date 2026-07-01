import type { JudgeResult } from "../../interfaces/scoring/interfaces.js";
import type { JiraTicket } from "../../interfaces/tickets/interfaces.js";
import type { OpenCodeRunResult } from "../../interfaces/opencode/interfaces.js";
import { ProcessRunError } from "../../adapters/process/ProcessRunner.js";
import { PatchComparisonService } from "../../services/patch-comparison/PatchComparisonService.js";
import { WorkspaceService } from "../../services/workspace-preparation/WorkspaceService.js";
import { JudgeWorkflow } from "./judge/JudgeWorkflow.js";
import { RunArtifactRepository } from "./RunArtifactRepository.js";
import { SolverWorkflow } from "./solver/SolverWorkflow.js";

type Logger = Pick<typeof console, "info" | "warn" | "error">;
type LogLevel = "info" | "warn" | "error";
type Phase = "solver" | "judge";
type FailurePhase = "setup" | "solver" | "patch" | "judge" | "report";

export class BenchmarkRunWorkflow {
  private readonly colorsEnabled = !process.env.NO_COLOR && process.env.FORCE_COLOR !== "0";
  private liveOutputNeedsNewline = false;

  constructor(
    private readonly workspaceService: WorkspaceService,
    private readonly patchService: PatchComparisonService,
    private readonly solverWorkflow: SolverWorkflow,
    private readonly judgeWorkflow: JudgeWorkflow,
    private readonly runRepository: RunArtifactRepository,
    private readonly logger: Logger,
  ) {}

  async runAll(tickets: JiraTicket[]): Promise<JudgeResult[]> {
    const results: JudgeResult[] = [];

    for (const [index, ticket] of tickets.entries()) {
      this.logStatus("info", "RUN", `Starting ticket ${index + 1}/${tickets.length}: ${ticket.id}`);
      let result: JudgeResult;
      let failed = false;

      try {
        result = await this.runTicket(ticket);
      } catch (error) {
        failed = true;
        result = this.createFailedTicketScore(ticket.id, error, {
          failureType: "ticket_execution_failed",
          failurePhase: "solver",
        });
        await this.runRepository.writeScore(ticket.id, result);
        this.logStatus("error", "FAIL", `Finished ticket ${index + 1}/${tickets.length}: ${ticket.id} failed; continuing.`);
      }

      results.push(result);

      if (!failed) {
        this.logStatus("info", "OK", `Finished ticket ${index + 1}/${tickets.length}: ${ticket.id}`);
      }
    }

    return results;
  }

  async runTicket(ticket: JiraTicket): Promise<JudgeResult> {
    await this.runRepository.createRunFolder(ticket.id);

    try {
      this.logStatus("info", "RUN", `${ticket.id}: ${ticket.title}`);

      const repoWorkingPath = await this.workspaceService.prepare(ticket);
      await this.runRepository.writeTicketMarkdown(ticket);

      const goldPatch = await this.patchService.createGoldPatch(ticket);
      await this.runRepository.writeGoldPatch(ticket.id, goldPatch);
      const runPaths = this.runRepository.pathsForTicket(ticket.id);

      const solverResult = await this.solverWorkflow.run(
        ticket,
        repoWorkingPath,
        runPaths,
        this.workflowTools(),
      );

      if (solverResult.kind === "empty-patch") {
        return solverResult.score;
      }

      return this.judgeWorkflow.run({
        ticket,
        repoWorkingPath,
        goldPatch,
        candidatePatch: solverResult.candidatePatch,
        runPaths,
        tools: this.workflowTools(),
      });
    } catch (error) {
      await this.runRepository.writeFailure(ticket.id, this.formatError(error));
      this.logStatus("error", "FAIL", `${ticket.id} stopped. Details saved to failure.txt.`);
      throw error;
    } finally {
      try {
        await this.workspaceService.resetAfterTicket(ticket);
      } catch (cleanupError) {
        this.logStatus("warn", "WARN", `${ticket.id} workspace cleanup failed: ${this.compactErrorMessage(cleanupError)}`);
      }
    }
  }

  private async runOpenCodeWithLogCapture(
    ticketId: string,
    run: () => Promise<OpenCodeRunResult>,
    phase: Phase,
  ): Promise<OpenCodeRunResult> {
    const startedAt = Date.now();
    this.logStatus("info", phase.toUpperCase(), `${ticketId} started. Live OpenCode output will stream below.`);
    const heartbeat = setInterval(() => {
      this.logStatus("info", "WAIT", `${ticketId} ${phase} still running after ${this.formatElapsed(Date.now() - startedAt)}.`);
    }, 30_000);
    heartbeat.unref();

    try {
      const result = await run();
      this.logStatus("info", "OK", `${ticketId} ${phase} finished in ${this.formatElapsed(Date.now() - startedAt)}.`);
      return result;
    } catch (error) {
      if (error instanceof ProcessRunError) {
        const failedOutput = {
          ...error.result,
          combinedOutput: [error.result.stdout, error.result.stderr ? `\n\nSTDERR:\n${error.result.stderr}` : ""].join(""),
        };

        if (phase === "solver") {
          await this.runRepository.writeSolverOutput(ticketId, failedOutput.combinedOutput);
          await this.runRepository.writeSolverLogs(ticketId, failedOutput);
        } else {
          await this.runRepository.writeJudgeOutput(ticketId, failedOutput.stdout);
          await this.runRepository.writeJudgeLogs(ticketId, failedOutput);
        }
      }

      this.logStatus("error", "FAIL", `${ticketId} ${phase} failed after ${this.formatElapsed(Date.now() - startedAt)}.`);
      throw error;
    } finally {
      clearInterval(heartbeat);
    }
  }

  private workflowTools() {
    return {
      runOpenCodeWithLogCapture: this.runOpenCodeWithLogCapture.bind(this),
      writeLiveOpenCodeOutput: this.writeLiveOpenCodeOutput.bind(this),
      logStatus: this.logStatus.bind(this),
    };
  }

  private writeLiveOpenCodeOutput(chunk: string): void {
    this.liveOutputNeedsNewline = !chunk.endsWith("\n") && !chunk.endsWith("\r");
    process.stdout.write(chunk);
  }

  private logStatus(level: LogLevel, label: string, message: string): void {
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

  private formatError(error: unknown): string {
    if (error instanceof Error) {
      return `${error.name}: ${error.message}\n${error.stack ?? ""}`.trimEnd() + "\n";
    }

    return `${String(error)}\n`;
  }

  private formatElapsed(milliseconds: number): string {
    const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes === 0) {
      return `${seconds}s`;
    }

    return `${minutes}m ${seconds}s`;
  }

  private createFailedTicketScore(
    ticketId: string,
    error: unknown,
    options: {
      failureType: string;
      failurePhase: FailurePhase;
      fallbackSummary?: string;
    },
  ): JudgeResult {
    const message = this.compactErrorMessage(error);

    return {
      taskId: ticketId,
      score: 0,
      verdict: "fail",
      solve_probability: 0,
      gold_alignment: 0,
      repo_pattern_quality: 0,
      minimality: 0,
      risk: 100,
      would_i_merge: false,
      summary: `${options.fallbackSummary ?? "Ticket execution failed before judging"}: ${message}`,
      strengths: [],
      problems: [message],
      failureType: options.failureType,
      failurePhase: options.failurePhase,
      failureMessage: message,
    };
  }

  private compactErrorMessage(error: unknown): string {
    const raw = error instanceof ProcessRunError
      ? this.firstErrorLine(error.result.stderr)
        ?? this.firstErrorLine(error.result.rawOutput)
        ?? this.firstMeaningfulLine(error.result.stderr)
        ?? this.firstMeaningfulLine(error.result.rawOutput)
        ?? this.firstMeaningfulLine(error.message)
      : error instanceof Error
        ? this.firstMeaningfulLine(error.message)
        : this.firstMeaningfulLine(String(error));

    return this.truncate(raw ?? "Unknown ticket execution failure.", 500);
  }

  private firstMeaningfulLine(value: string): string | undefined {
    return value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean);
  }

  private firstErrorLine(value: string): string | undefined {
    return value
      .split(/\r?\n/)
      .map((line) => line.replace(/\u001b\[[0-9;]*m/g, "").trim())
      .find((line) => /(^error:|error=|error\.error=|file not found|command line is too long|spawn enametoolong)/i.test(line));
  }

  private truncate(value: string, maxLength: number): string {
    if (value.length <= maxLength) {
      return value;
    }

    return `${value.slice(0, maxLength - 3)}...`;
  }
}
