import path from "node:path";
import type { OpenCodeRunResult } from "../../interfaces/opencode/interfaces.js";
import type { JudgeResult } from "../../interfaces/scoring/interfaces.js";
import { judgeResultSchema } from "../../interfaces/scoring/schemas.js";
import type { JiraTicket } from "../../interfaces/tickets/interfaces.js";
import { FileSystem } from "../platform/FileSystem.js";
import { TicketPromptBuilder } from "../preparation/tickets/TicketPromptBuilder.js";
import { RunPaths } from "./RunPaths.js";

export class RunRepository {
  constructor(
    private readonly runPaths: RunPaths,
    private readonly fileSystem: FileSystem,
    private readonly ticketPromptBuilder: TicketPromptBuilder,
  ) {}

  async createRunFolder(ticketId: string): Promise<void> {
    await this.fileSystem.ensureDir(this.runPaths.forTicket(ticketId).runDir);
  }

  pathsForTicket(ticketId: string) {
    return this.runPaths.forTicket(ticketId);
  }

  async writeTicketMarkdown(ticket: JiraTicket): Promise<void> {
    const paths = this.runPaths.forTicket(ticket.id);
    await this.fileSystem.writeText(
      paths.ticketMarkdownPath,
      this.ticketPromptBuilder.buildMarkdown(ticket),
    );
  }

  async writeGoldPatch(ticketId: string, patch: string): Promise<void> {
    await this.fileSystem.writeText(this.runPaths.forTicket(ticketId).goldPatchPath, patch);
  }

  async writeCandidatePatch(ticketId: string, patch: string): Promise<void> {
    await this.fileSystem.writeText(this.runPaths.forTicket(ticketId).candidatePatchPath, patch);
  }

  async writeSolverOutput(ticketId: string, output: string): Promise<void> {
    await this.fileSystem.writeText(this.runPaths.forTicket(ticketId).solverOutputPath, output);
  }

  async writeSolverLogs(ticketId: string, logs: OpenCodeRunResult): Promise<void> {
    const paths = this.runPaths.forTicket(ticketId);
    await this.fileSystem.writeText(paths.solverRawLogPath, logs.rawOutput);
    await this.fileSystem.writeText(paths.solverStdoutLogPath, logs.stdout);
    await this.fileSystem.writeText(paths.solverStderrLogPath, logs.stderr);
  }

  async writeJudgeInput(ticketId: string, input: string): Promise<void> {
    await this.fileSystem.writeText(this.runPaths.forTicket(ticketId).judgeInputPath, input);
  }

  async writeJudgeOutput(ticketId: string, output: string): Promise<void> {
    await this.fileSystem.writeText(this.runPaths.forTicket(ticketId).judgeOutputPath, output);
  }

  async writeJudgeLogs(ticketId: string, logs: OpenCodeRunResult): Promise<void> {
    const paths = this.runPaths.forTicket(ticketId);
    await this.fileSystem.writeText(paths.judgeRawLogPath, logs.rawOutput);
    await this.fileSystem.writeText(paths.judgeStdoutLogPath, logs.stdout);
    await this.fileSystem.writeText(paths.judgeStderrLogPath, logs.stderr);
  }

  async writeScore(ticketId: string, score: JudgeResult): Promise<void> {
    await this.fileSystem.writeJson(this.runPaths.forTicket(ticketId).scorePath, score);
  }

  async readScores(): Promise<JudgeResult[]> {
    const runRoot = this.runPaths.root();
    const ticketDirs = await this.fileSystem.readDirectory(runRoot);
    const scores: JudgeResult[] = [];

    for (const ticketDir of ticketDirs) {
      const scorePath = path.join(runRoot, ticketDir, "score.json");

      if (await this.fileSystem.exists(scorePath)) {
        scores.push(judgeResultSchema.parse(await this.fileSystem.readJson(scorePath)));
      }
    }

    return scores.sort((left, right) => left.taskId.localeCompare(right.taskId));
  }
}
