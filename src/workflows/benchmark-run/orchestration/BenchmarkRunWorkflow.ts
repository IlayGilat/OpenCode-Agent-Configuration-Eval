import type { JudgeResult } from "../../../interfaces/scoring/interfaces.js";
import type { JiraTicket } from "../../../interfaces/tickets/interfaces.js";
import { PatchComparisonService } from "../../../services/patch-comparison/PatchComparisonService.js";
import { WorkspaceService } from "../../../services/workspace-preparation/WorkspaceService.js";
import { createFailedScore } from "../../../shared/scoring/createFailedScore.js";
import { compactErrorMessage, formatError } from "../../../shared/errors/errors.js";
import { RunArtifactRepository } from "../artifacts/RunArtifactRepository.js";
import { WorkflowConsole } from "../console/WorkflowConsole.js";
import { OpenCodePhaseRunner } from "../execution/OpenCodePhaseRunner.js";
import type { Logger } from "../execution/WorkflowTools.js";
import { JudgeWorkflow } from "../judge/JudgeWorkflow.js";
import { SolverWorkflow } from "../solver/SolverWorkflow.js";

export class BenchmarkRunWorkflow {
  private readonly workflowConsole: WorkflowConsole;
  private readonly openCodePhaseRunner: OpenCodePhaseRunner;

  constructor(
    private readonly workspaceService: WorkspaceService,
    private readonly patchService: PatchComparisonService,
    private readonly solverWorkflow: SolverWorkflow,
    private readonly judgeWorkflow: JudgeWorkflow,
    private readonly runRepository: RunArtifactRepository,
    logger: Logger,
  ) {
    this.workflowConsole = new WorkflowConsole(logger);
    this.openCodePhaseRunner = new OpenCodePhaseRunner(runRepository, this.workflowConsole);
  }

  async runAll(tickets: JiraTicket[]): Promise<JudgeResult[]> {
    const results: JudgeResult[] = [];

    for (const [index, ticket] of tickets.entries()) {
      this.workflowConsole.logStatus("info", "RUN", `Starting ticket ${index + 1}/${tickets.length}: ${ticket.id}`);
      let result: JudgeResult;
      let failed = false;

      try {
        result = await this.runTicket(ticket);
      } catch (error) {
        failed = true;
        result = createFailedScore(ticket.id, error, {
          failureType: "ticket_execution_failed",
          failurePhase: "solver",
        });
        await this.runRepository.writeScore(ticket.id, result);
        this.workflowConsole.logStatus("error", "FAIL", `Finished ticket ${index + 1}/${tickets.length}: ${ticket.id} failed; continuing.`);
      }

      results.push(result);

      if (!failed) {
        this.workflowConsole.logStatus("info", "OK", `Finished ticket ${index + 1}/${tickets.length}: ${ticket.id}`);
      }
    }

    return results;
  }

  private async runTicket(ticket: JiraTicket): Promise<JudgeResult> {
    await this.runRepository.createRunFolder(ticket.id);

    try {
      this.workflowConsole.logStatus("info", "RUN", `${ticket.id}: ${ticket.title}`);

      const repoWorkingPath = await this.workspaceService.prepare(ticket);
      await this.runRepository.writeTicketMarkdown(ticket);

      const goldPatch = await this.patchService.createGoldPatch(ticket);
      await this.runRepository.writeGoldPatch(ticket.id, goldPatch);
      const runPaths = this.runRepository.pathsForTicket(ticket.id);
      const tools = this.workflowConsole.tools(this.openCodePhaseRunner.run.bind(this.openCodePhaseRunner));

      const solverResult = await this.solverWorkflow.run(
        ticket,
        repoWorkingPath,
        runPaths,
        tools,
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
        tools,
      });
    } catch (error) {
      await this.runRepository.writeFailure(ticket.id, formatError(error));
      this.workflowConsole.logStatus("error", "FAIL", `${ticket.id} stopped. Details saved to failure.txt.`);
      throw error;
    } finally {
      try {
        await this.workspaceService.resetAfterTicket(ticket);
      } catch (cleanupError) {
        this.workflowConsole.logStatus("warn", "WARN", `${ticket.id} workspace cleanup failed: ${compactErrorMessage(cleanupError)}`);
      }
    }
  }
}
