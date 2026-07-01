import type { JudgeResult } from "../../interfaces/scoring/interfaces.js";
import type { JiraTicket } from "../../interfaces/tickets/interfaces.js";
import { OpenCodeTaskRunner } from "./opencode/OpenCodeTaskRunner.js";
import { ProcessRunError } from "../platform/ProcessRunner.js";
import { PatchService } from "../preparation/workspace/PatchService.js";
import { WorkspaceService } from "../preparation/workspace/WorkspaceService.js";
import { JudgePromptBuilder } from "../review/JudgePromptBuilder.js";
import { JudgeResultParser } from "../review/JudgeResultParser.js";
import { createEmptyPatchScore } from "../review/createEmptyPatchScore.js";
import { RunRepository } from "./RunRepository.js";

type Logger = Pick<typeof console, "info" | "warn" | "error">;
type LogLevel = "info" | "warn" | "error";
type Phase = "solver" | "judge";

export class RunService {
  private readonly colorsEnabled = !process.env.NO_COLOR && process.env.FORCE_COLOR !== "0";
  private liveOutputNeedsNewline = false;

  constructor(
    private readonly workspaceService: WorkspaceService,
    private readonly patchService: PatchService,
    private readonly openCodeTaskRunner: OpenCodeTaskRunner,
    private readonly judgePromptBuilder: JudgePromptBuilder,
    private readonly judgeResultParser: JudgeResultParser,
    private readonly runRepository: RunRepository,
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
        result = this.createFailedTicketScore(ticket.id, error);
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

      const solverOutput = await this.runOpenCodeWithLogCapture(
        ticket.id,
        () => this.openCodeTaskRunner.solve(ticket, repoWorkingPath, {
          promptPath: runPaths.solverPromptPath,
          rawPath: runPaths.solverRawLogPath,
          stdoutPath: runPaths.solverStdoutLogPath,
          stderrPath: runPaths.solverStderrLogPath,
          transcriptPath: runPaths.opencodeLogPath,
          phase: "solver",
          onConsoleOutput: (chunk) => this.writeLiveOpenCodeOutput(chunk),
        }),
        "solver",
      );
      await this.runRepository.writeSolverOutput(ticket.id, solverOutput.combinedOutput);
      await this.runRepository.writeSolverLogs(ticket.id, solverOutput);

      this.logStatus("info", "PATCH", `${ticket.id} capturing candidate patch.`);
      const candidatePatch = await this.patchService.captureCandidatePatch(repoWorkingPath);
      await this.runRepository.writeCandidatePatch(ticket.id, candidatePatch);
      this.logStatus("info", "PATCH", `${ticket.id} candidate patch saved.`);

      if (this.patchService.isEmptyPatch(candidatePatch)) {
        const emptyScore = createEmptyPatchScore(ticket.id);
        await this.runRepository.writeScore(ticket.id, emptyScore);
        this.logStatus("warn", "WARN", `${ticket.id} produced no patch. Scored as fail.`);
        return emptyScore;
      }

      const judgePrompt = await this.judgePromptBuilder.build({
        ticket,
        goldPatch,
        candidatePatch,
      });

      await this.runRepository.writeJudgeInput(ticket.id, judgePrompt);

      const rawJudgeOutput = await this.runOpenCodeWithLogCapture(
        ticket.id,
        () => this.openCodeTaskRunner.judge(judgePrompt, repoWorkingPath, {
          promptPath: runPaths.judgePromptPath,
          rawPath: runPaths.judgeRawLogPath,
          stdoutPath: runPaths.judgeStdoutLogPath,
          stderrPath: runPaths.judgeStderrLogPath,
          transcriptPath: runPaths.opencodeLogPath,
          phase: "judge",
          onConsoleOutput: (chunk) => this.writeLiveOpenCodeOutput(chunk),
        }),
        "judge",
      );
      await this.runRepository.writeJudgeOutput(ticket.id, rawJudgeOutput.combinedOutput);
      await this.runRepository.writeJudgeLogs(ticket.id, rawJudgeOutput);

      const score = this.judgeResultParser.parse(ticket.id, rawJudgeOutput.combinedOutput);
      await this.runRepository.writeScore(ticket.id, score);
      this.logStatus("info", "SCORE", `${ticket.id} scored ${score.score} (${score.verdict})`);

      return score;
    } catch (error) {
      await this.runRepository.writeFailure(ticket.id, this.formatError(error));
      this.logStatus("error", "FAIL", `${ticket.id} stopped. Details saved to failure.txt.`);
      throw error;
    }
  }

  private async runOpenCodeWithLogCapture(
    ticketId: string,
    run: () => Promise<{ stdout: string; stderr: string; rawOutput: string; combinedOutput: string }>,
    phase: Phase,
  ): Promise<{ stdout: string; stderr: string; rawOutput: string; combinedOutput: string }> {
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
          await this.runRepository.writeJudgeOutput(ticketId, failedOutput.combinedOutput);
          await this.runRepository.writeJudgeLogs(ticketId, failedOutput);
        }
      }

      this.logStatus("error", "FAIL", `${ticketId} ${phase} failed after ${this.formatElapsed(Date.now() - startedAt)}.`);
      throw error;
    } finally {
      clearInterval(heartbeat);
    }
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

  private createFailedTicketScore(ticketId: string, error: unknown): JudgeResult {
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
      summary: `Ticket execution failed before judging: ${message}`,
      strengths: [],
      problems: [message],
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
