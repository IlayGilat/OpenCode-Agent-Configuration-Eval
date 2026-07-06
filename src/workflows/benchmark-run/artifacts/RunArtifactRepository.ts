import path from "node:path";
import type { OpenCodeRunResult } from "../../../interfaces/opencode/interfaces.js";
import type { JudgeResult } from "../../../interfaces/scoring/interfaces.js";
import { judgeResultSchema } from "../../../interfaces/scoring/schemas.js";
import type { JiraTicket } from "../../../interfaces/tickets/interfaces.js";
import { FileSystem } from "../../../adapters/filesystem/FileSystem.js";
import { TicketPromptBuilder } from "../../../services/ticket-input/TicketPromptBuilder.js";
import { RunPaths } from "../../pre-benchmark-run/RunPaths.js";
import { compactSavedOutput as compactOutput } from "./compactSavedOutput.js";

export class RunArtifactRepository {
  private static readonly savedOutputCharacterLimit = 20_000;

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
    await this.fileSystem.writeText(this.runPaths.forTicket(ticketId).solverOutputPath, compactOutput(output, RunArtifactRepository.savedOutputCharacterLimit));
  }

  async writeSolverLogs(ticketId: string, logs: OpenCodeRunResult): Promise<void> {
    const paths = this.runPaths.forTicket(ticketId);
    await this.fileSystem.writeText(paths.solverRawLogPath, compactOutput(logs.rawOutput, RunArtifactRepository.savedOutputCharacterLimit));
    await this.fileSystem.writeText(paths.solverStdoutLogPath, compactOutput(logs.stdout, RunArtifactRepository.savedOutputCharacterLimit));
    await this.fileSystem.writeText(paths.solverStderrLogPath, compactOutput(logs.stderr, RunArtifactRepository.savedOutputCharacterLimit));
  }

  async writeJudgeInput(ticketId: string, input: string): Promise<void> {
    await this.fileSystem.writeText(this.runPaths.forTicket(ticketId).judgePromptPath, input);
  }

  async writeJudgeOutput(ticketId: string, output: string): Promise<void> {
    await this.fileSystem.writeText(this.runPaths.forTicket(ticketId).judgeOutputPath, compactOutput(output, RunArtifactRepository.savedOutputCharacterLimit));
  }

  async writeJudgeLogs(ticketId: string, logs: OpenCodeRunResult): Promise<void> {
    const paths = this.runPaths.forTicket(ticketId);
    await this.fileSystem.writeText(paths.judgeRawLogPath, compactOutput(logs.rawOutput, RunArtifactRepository.savedOutputCharacterLimit));
    await this.fileSystem.writeText(paths.judgeStdoutLogPath, compactOutput(logs.stdout, RunArtifactRepository.savedOutputCharacterLimit));
    await this.fileSystem.writeText(paths.judgeStderrLogPath, compactOutput(logs.stderr, RunArtifactRepository.savedOutputCharacterLimit));
  }

  async writeScore(ticketId: string, score: JudgeResult): Promise<void> {
    await this.fileSystem.writeJson(this.runPaths.forTicket(ticketId).scorePath, score);
  }

  async writeFailure(ticketId: string, failure: string): Promise<void> {
    await this.fileSystem.writeText(this.runPaths.forTicket(ticketId).failurePath, failure);
  }

  async readScores(): Promise<JudgeResult[]> {
    const runRoot = this.runPaths.root();
    const ticketDirs = await this.fileSystem.readDirectory(runRoot);
    const scores: JudgeResult[] = [];

    for (const ticketDir of ticketDirs) {
      const scorePath = path.join(runRoot, ticketDir, "result", "score.json");
      const legacyScorePath = path.join(runRoot, ticketDir, "score.json");

      if (await this.fileSystem.exists(scorePath)) {
        scores.push(judgeResultSchema.parse(await this.fileSystem.readJson(scorePath)));
      } else if (await this.fileSystem.exists(legacyScorePath)) {
        scores.push(judgeResultSchema.parse(await this.fileSystem.readJson(legacyScorePath)));
      }
    }

    return scores.sort((left, right) => left.taskId.localeCompare(right.taskId));
  }
}
