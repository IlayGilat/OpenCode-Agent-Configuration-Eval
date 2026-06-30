import type { JiraTicket, JudgeResult } from "../../domain/domain.js";
import { WorkspaceService } from "../../infrastructure/workspace/WorkspaceService.js";
import { PatchService } from "../../infrastructure/workspace/PatchService.js";
import { SolverRunner } from "../../infrastructure/opencode/SolverRunner.js";
import { JudgePromptBuilder } from "../scoring/JudgePromptBuilder.js";
import { JudgeRunner } from "../../infrastructure/opencode/JudgeRunner.js";
import { JudgeResultParser } from "../scoring/JudgeResultParser.js";
import { createEmptyPatchScore } from "../scoring/createEmptyPatchScore.js";
import { RunRepository } from "./RunRepository.js";
import { Logger } from "../../infrastructure/logging/Logger.js";
import { ProcessRunError } from "../../infrastructure/process/ProcessRunner.js";

export class RunService {
  constructor(
    private readonly workspaceService: WorkspaceService,
    private readonly patchService: PatchService,
    private readonly solverRunner: SolverRunner,
    private readonly judgePromptBuilder: JudgePromptBuilder,
    private readonly judgeRunner: JudgeRunner,
    private readonly judgeResultParser: JudgeResultParser,
    private readonly runRepository: RunRepository,
    private readonly logger: Logger,
  ) {}

  async runAll(tickets: JiraTicket[]): Promise<JudgeResult[]> {
    const results: JudgeResult[] = [];

    for (const ticket of tickets) {
      results.push(await this.runTicket(ticket));
    }

    return results;
  }

  async runTicket(ticket: JiraTicket): Promise<JudgeResult> {
    this.logger.info(`Running ${ticket.id}: ${ticket.title}`);
    await this.runRepository.createRunFolder(ticket.id);

    const workspacePath = await this.workspaceService.prepare(ticket);
    await this.runRepository.writeTicketMarkdown(ticket);

    const goldPatch = await this.patchService.createGoldPatch(ticket);
    await this.runRepository.writeGoldPatch(ticket.id, goldPatch);
    const runPaths = this.runRepository.pathsForTicket(ticket.id);

    const solverOutput = await this.runOpenCodeWithLogCapture(
      ticket.id,
      () => this.solverRunner.solve(ticket, workspacePath, {
        rawPath: runPaths.solverRawLogPath,
        stdoutPath: runPaths.solverStdoutLogPath,
        stderrPath: runPaths.solverStderrLogPath,
      }),
      "solver",
    );
    await this.runRepository.writeSolverOutput(ticket.id, solverOutput.combinedOutput);
    await this.runRepository.writeSolverLogs(ticket.id, solverOutput);

    const candidatePatch = await this.patchService.captureCandidatePatch(workspacePath);
    await this.runRepository.writeCandidatePatch(ticket.id, candidatePatch);

    if (this.patchService.isEmptyPatch(candidatePatch)) {
      const emptyScore = createEmptyPatchScore(ticket.id);
      await this.runRepository.writeScore(ticket.id, emptyScore);
      this.logger.warn(`${ticket.id} produced no patch. Scored as fail.`);
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
      () => this.judgeRunner.judge(judgePrompt, workspacePath, {
        rawPath: runPaths.judgeRawLogPath,
        stdoutPath: runPaths.judgeStdoutLogPath,
        stderrPath: runPaths.judgeStderrLogPath,
      }),
      "judge",
    );
    await this.runRepository.writeJudgeOutput(ticket.id, rawJudgeOutput.combinedOutput);
    await this.runRepository.writeJudgeLogs(ticket.id, rawJudgeOutput);

    const score = this.judgeResultParser.parse(ticket.id, rawJudgeOutput.combinedOutput);
    await this.runRepository.writeScore(ticket.id, score);
    this.logger.info(`${ticket.id} scored ${score.score} (${score.verdict})`);

    return score;
  }

  private async runOpenCodeWithLogCapture(
    ticketId: string,
    run: () => Promise<{ stdout: string; stderr: string; rawOutput: string; combinedOutput: string }>,
    phase: "solver" | "judge",
  ): Promise<{ stdout: string; stderr: string; rawOutput: string; combinedOutput: string }> {
    try {
      return await run();
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

      throw error;
    }
  }
}
