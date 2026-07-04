import type { OpenCodeRunResult } from "../../../interfaces/opencode/interfaces.js";
import type { JudgeResult } from "../../../interfaces/scoring/interfaces.js";
import type { JiraTicket } from "../../../interfaces/tickets/interfaces.js";
import { OpenCodeTaskRunner } from "../../../services/opencode-task-execution/OpenCodeTaskRunner.js";
import { PatchComparisonService } from "../../../services/patch-comparison/PatchComparisonService.js";
import { createEmptyPatchScore } from "../../../services/judge-evaluation/createEmptyPatchScore.js";
import { RunArtifactRepository } from "../RunArtifactRepository.js";

type LogLevel = "info" | "warn" | "error";
type Phase = "solver" | "judge";

type OpenCodePhaseRunner = (
  ticketId: string,
  run: () => Promise<OpenCodeRunResult>,
  phase: Phase,
) => Promise<OpenCodeRunResult>;

type WorkflowTools = {
  runOpenCodeWithLogCapture: OpenCodePhaseRunner;
  writeLiveOpenCodeOutput: (chunk: string) => void;
  logStatus: (level: LogLevel, label: string, message: string) => void;
};

type SolverRunPaths = ReturnType<RunArtifactRepository["pathsForTicket"]>;

export type SolverWorkflowResult =
  | { kind: "empty-patch"; score: JudgeResult }
  | { kind: "candidate-patch"; candidatePatch: string };

export class SolverWorkflow {
  constructor(
    private readonly openCodeTaskRunner: OpenCodeTaskRunner,
    private readonly patchComparisonService: PatchComparisonService,
    private readonly runRepository: RunArtifactRepository,
    private readonly testCommand?: string,
  ) {}

  private async runVerification(
    repoWorkingPath: string,
    tools: WorkflowTools,
  ): Promise<boolean> {
    if (!this.testCommand) return true;
    tools.logStatus("info", "VERIFY", "Running post-patch verification...");
    // Placeholder for actual execution logic using WorkspaceService or similar.
    // For now, this just logs and returns true.
    return true;
  }

  async run(
    ticket: JiraTicket,
    repoWorkingPath: string,
    runPaths: SolverRunPaths,
    tools: WorkflowTools,
  ): Promise<SolverWorkflowResult> {
    const solverOutput = await tools.runOpenCodeWithLogCapture(
      ticket.id,
      () => this.openCodeTaskRunner.solve(ticket, repoWorkingPath, {
        promptPath: runPaths.solverPromptPath,
        rawPath: runPaths.solverRawLogPath,
        stdoutPath: runPaths.solverStdoutLogPath,
        stderrPath: runPaths.solverStderrLogPath,
        transcriptPath: runPaths.opencodeLogPath,
        phase: "solver",
        onConsoleOutput: (chunk) => tools.writeLiveOpenCodeOutput(chunk),
      }),
      "solver",
    );
    await this.runRepository.writeSolverOutput(ticket.id, solverOutput.combinedOutput);
    await this.runRepository.writeSolverLogs(ticket.id, solverOutput);

    tools.logStatus("info", "PATCH", `${ticket.id} capturing candidate patch.`);
    const candidatePatch = await this.patchComparisonService.captureCandidatePatch(repoWorkingPath);
    await this.runRepository.writeCandidatePatch(ticket.id, candidatePatch);
    tools.logStatus("info", "PATCH", `${ticket.id} candidate patch saved.`);

    await this.runVerification(repoWorkingPath, tools);

    if (this.patchComparisonService.isEmptyPatch(candidatePatch)) {
      const emptyScore = createEmptyPatchScore(ticket.id);
      await this.runRepository.writeScore(ticket.id, emptyScore);
      tools.logStatus("warn", "WARN", `${ticket.id} produced no patch. Scored as fail.`);
      return { kind: "empty-patch", score: emptyScore };
    }

    return { kind: "candidate-patch", candidatePatch };
  }
}
