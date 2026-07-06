import type { OpenCodeRunResult } from "../../../interfaces/opencode/interfaces.js";
import { ProcessRunError } from "../../../adapters/process/ProcessRunner.js";
import { RunArtifactRepository } from "../artifacts/RunArtifactRepository.js";
import type { Phase } from "./WorkflowTools.js";
import { WorkflowConsole } from "../console/WorkflowConsole.js";

export class OpenCodePhaseRunner {
  constructor(
    private readonly runRepository: RunArtifactRepository,
    private readonly workflowConsole: WorkflowConsole,
  ) {}

  async run(
    ticketId: string,
    run: () => Promise<OpenCodeRunResult>,
    phase: Phase,
  ): Promise<OpenCodeRunResult> {
    const startedAt = Date.now();
    this.workflowConsole.logStatus("info", phase.toUpperCase(), `${ticketId} started. Live OpenCode output will stream below.`);
    const heartbeat = setInterval(() => {
      this.workflowConsole.logStatus("info", "WAIT", `${ticketId} ${phase} still running after ${formatElapsed(Date.now() - startedAt)}.`);
    }, 30_000);
    heartbeat.unref();

    try {
      const result = await run();
      this.workflowConsole.logStatus("info", "OK", `${ticketId} ${phase} finished in ${formatElapsed(Date.now() - startedAt)}.`);
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

      this.workflowConsole.logStatus("error", "FAIL", `${ticketId} ${phase} failed after ${formatElapsed(Date.now() - startedAt)}.`);
      throw error;
    } finally {
      clearInterval(heartbeat);
    }
  }
}

export function formatElapsed(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${seconds}s`;
}
