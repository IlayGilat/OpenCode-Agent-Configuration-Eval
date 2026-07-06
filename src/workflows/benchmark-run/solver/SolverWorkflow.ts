import type { JudgeResult } from "../../../interfaces/scoring/interfaces.js";
import type { JiraTicket } from "../../../interfaces/tickets/interfaces.js";
import { OpenCodeTaskRunner } from "../../../services/opencode-task-execution/OpenCodeTaskRunner.js";
import { PatchComparisonService } from "../../../services/patch-comparison/PatchComparisonService.js";
import { createEmptyPatchScore } from "../../../services/judge-evaluation/scores/createEmptyPatchScore.js";
import { RunArtifactRepository } from "../artifacts/RunArtifactRepository.js";
import type { WorkflowTools } from "../execution/WorkflowTools.js";

type SolverRunPaths = ReturnType<RunArtifactRepository["pathsForTicket"]>;

export type SolverWorkflowResult =
  | { kind: "empty-patch"; score: JudgeResult }
  | { kind: "candidate-patch"; candidatePatch: string };

export class SolverWorkflow {
  constructor(
    private readonly openCodeTaskRunner: OpenCodeTaskRunner,
    private readonly patchComparisonService: PatchComparisonService,
    private readonly runRepository: RunArtifactRepository,
  ) {}

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

    if (this.patchComparisonService.isEmptyPatch(candidatePatch)) {
      const emptyScore = createEmptyPatchScore(ticket.id);
      await this.runRepository.writeScore(ticket.id, emptyScore);
      tools.logStatus("warn", "WARN", `${ticket.id} produced no patch. Scored as fail.`);
      return { kind: "empty-patch", score: emptyScore };
    }

    return { kind: "candidate-patch", candidatePatch };
  }
}
