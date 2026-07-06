import type { JudgeResult } from "../../../interfaces/scoring/interfaces.js";
import type { JiraTicket } from "../../../interfaces/tickets/interfaces.js";
import { PatchComparisonService } from "../../../services/patch-comparison/patch-comparison-service.js";
import { WorkspaceService } from "../../../services/workspace-preparation/workspace-service.js";
import { createFailedScore } from "../../../shared/scoring/create-failed-score.js";
import { compactErrorMessage, formatError } from "../../../shared/errors/errors.js";
import { RunArtifactRepository } from "../artifacts/run-artifact-repository.js";
import { WorkflowConsole } from "../console/workflow-console.js";
import { OpenCodePhaseRunner } from "../execution/open-code-phase-runner.js";
import type { Logger } from "../execution/workflow-tools.js";
import { JudgeWorkflow } from "../judge/judge-workflow.js";
import { SolverWorkflow } from "../solver/solver-workflow.js";

type FailurePhase = NonNullable<JudgeResult["failurePhase"]>;

class TicketRunError extends Error {
  constructor(
    readonly failurePhase: FailurePhase,
    readonly originalError: unknown,
  ) {
    super(originalError instanceof Error ? originalError.message : String(originalError));
    this.name = "TicketRunError";
  }
}

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
        const failurePhase = error instanceof TicketRunError ? error.failurePhase : "setup";
        const originalError = error instanceof TicketRunError ? error.originalError : error;
        failed = true;
        result = createFailedScore(ticket.id, originalError, {
          failureType: failureTypeForPhase(failurePhase),
          failurePhase,
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
    let failurePhase: FailurePhase = "setup";

    try {
      await this.runRepository.createRunFolder(ticket.id);
      this.workflowConsole.logStatus("info", "RUN", `${ticket.id}: ${ticket.title}`);

      const repoWorkingPath = await this.workspaceService.prepare(ticket);
      await this.runRepository.writeTicketMarkdown(ticket);

      failurePhase = "patch";
      const goldPatch = await this.patchService.createGoldPatch(ticket);
      await this.runRepository.writeGoldPatch(ticket.id, goldPatch);
      const runPaths = this.runRepository.pathsForTicket(ticket.id);
      const tools = this.workflowConsole.tools(this.openCodePhaseRunner.run.bind(this.openCodePhaseRunner));

      failurePhase = "solver";
      const solverResult = await this.solverWorkflow.run(
        ticket,
        repoWorkingPath,
        runPaths,
        tools,
      );

      if (solverResult.kind === "empty-patch") {
        return solverResult.score;
      }

      failurePhase = "judge";
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
      throw new TicketRunError(failurePhase, error);
    } finally {
      try {
        await this.workspaceService.resetAfterTicket(ticket);
      } catch (cleanupError) {
        this.workflowConsole.logStatus("warn", "WARN", `${ticket.id} workspace cleanup failed: ${compactErrorMessage(cleanupError)}`);
      }
    }
  }
}

function failureTypeForPhase(phase: FailurePhase): string {
  switch (phase) {
    case "setup":
      return "setup_failed";
    case "patch":
      return "patch_capture_failed";
    case "solver":
      return "solver_execution_failed";
    case "judge":
      return "judge_execution_failed";
    case "report":
      return "report_failed";
  }
}
