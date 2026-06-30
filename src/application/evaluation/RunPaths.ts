import path from "node:path";
import type { TicketRunPaths } from "../../domain/domain.js";

export class RunPaths {
  constructor(private readonly runsPath: string) {}

  root(): string {
    return this.runsPath;
  }

  forTicket(ticketId: string): TicketRunPaths {
    const runDir = path.join(this.runsPath, ticketId);
    const logsDir = path.join(runDir, "logs");

    return {
      runDir,
      ticketMarkdownPath: path.join(runDir, "ticket.md"),
      goldPatchPath: path.join(runDir, "gold.patch"),
      candidatePatchPath: path.join(runDir, "candidate.patch"),
      solverOutputPath: path.join(runDir, "solver-output.txt"),
      solverRawLogPath: path.join(logsDir, "solver-raw.log"),
      solverStdoutLogPath: path.join(logsDir, "solver-stdout.log"),
      solverStderrLogPath: path.join(logsDir, "solver-stderr.log"),
      judgeInputPath: path.join(runDir, "judge-input.md"),
      judgeOutputPath: path.join(runDir, "judge-output.txt"),
      opencodeLogPath: path.join(runDir, "opencode.log"),
      judgeRawLogPath: path.join(logsDir, "judge-raw.log"),
      judgeStdoutLogPath: path.join(logsDir, "judge-stdout.log"),
      judgeStderrLogPath: path.join(logsDir, "judge-stderr.log"),
      scorePath: path.join(runDir, "score.json"),
    };
  }
}
