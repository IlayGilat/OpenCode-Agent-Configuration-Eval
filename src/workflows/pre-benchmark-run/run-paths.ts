import path from "node:path";
import type { TicketRunPaths } from "../../interfaces/evaluation/interfaces.js";
import { toKebabCase } from "../../shared/text/to-kebab-case.js";

export class RunPaths {
  constructor(private readonly runsPath: string) {}

  root(): string {
    return this.runsPath;
  }

  forTicket(ticketId: string): TicketRunPaths {
    const ticketFolderName = toKebabCase(ticketId);
    const runDir = path.join(this.runsPath, ticketFolderName);
    const inputDir = path.join(runDir, "input");
    const patchesDir = path.join(runDir, "patches");
    const outputDir = path.join(runDir, "output");
    const resultDir = path.join(runDir, "result");
    const logsDir = path.join(runDir, "logs");
    const solverLogsDir = path.join(logsDir, "solver");
    const judgeLogsDir = path.join(logsDir, "judge");

    return {
      runDir,
      inputDir,
      patchesDir,
      outputDir,
      resultDir,
      solverLogsDir,
      judgeLogsDir,
      ticketMarkdownPath: path.join(inputDir, "ticket.md"),
      solverPromptPath: path.join(inputDir, "solver-prompt.md"),
      goldPatchPath: path.join(patchesDir, "gold.patch"),
      candidatePatchPath: path.join(patchesDir, "candidate.patch"),
      solverOutputPath: path.join(outputDir, "solver-output.txt"),
      solverRawLogPath: path.join(solverLogsDir, "raw.log"),
      solverStdoutLogPath: path.join(solverLogsDir, "stdout.log"),
      solverStderrLogPath: path.join(solverLogsDir, "stderr.log"),
      judgePromptPath: path.join(inputDir, "judge-prompt.md"),
      judgeOutputPath: path.join(outputDir, "judge-output.txt"),
      opencodeLogPath: path.join(logsDir, "opencode.log"),
      judgeRawLogPath: path.join(judgeLogsDir, "raw.log"),
      judgeStdoutLogPath: path.join(judgeLogsDir, "stdout.log"),
      judgeStderrLogPath: path.join(judgeLogsDir, "stderr.log"),
      scorePath: path.join(resultDir, "score.json"),
      failurePath: path.join(resultDir, "failure.txt"),
    };
  }
}
