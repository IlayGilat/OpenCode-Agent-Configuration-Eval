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

export class RunService {
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

    for (const ticket of tickets) {
      results.push(await this.runTicket(ticket));
    }

    return results;
  }

  async runTicket(ticket: JiraTicket): Promise<JudgeResult> {
    this.logger.info(`Running ${ticket.id}: ${ticket.title}`);
    await this.runRepository.createRunFolder(ticket.id);

    const repoWorkingPath = await this.workspaceService.prepare(ticket);
    await this.runRepository.writeTicketMarkdown(ticket);

    const goldPatch = await this.patchService.createGoldPatch(ticket);
    await this.runRepository.writeGoldPatch(ticket.id, goldPatch);
    const runPaths = this.runRepository.pathsForTicket(ticket.id);

    const solverOutput = await this.runOpenCodeWithLogCapture(
      ticket.id,
      () => this.openCodeTaskRunner.solve(ticket, repoWorkingPath, {
        rawPath: runPaths.solverRawLogPath,
        stdoutPath: runPaths.solverStdoutLogPath,
        stderrPath: runPaths.solverStderrLogPath,
        transcriptPath: runPaths.opencodeLogPath,
        phase: "solver",
      }),
      "solver",
    );
    await this.runRepository.writeSolverOutput(ticket.id, solverOutput.combinedOutput);
    await this.runRepository.writeSolverLogs(ticket.id, solverOutput);

    const candidatePatch = await this.patchService.captureCandidatePatch(repoWorkingPath);
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
      () => this.openCodeTaskRunner.judge(judgePrompt, repoWorkingPath, {
        rawPath: runPaths.judgeRawLogPath,
        stdoutPath: runPaths.judgeStdoutLogPath,
        stderrPath: runPaths.judgeStderrLogPath,
        transcriptPath: runPaths.opencodeLogPath,
        phase: "judge",
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
