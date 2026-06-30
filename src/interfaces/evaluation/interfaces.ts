export type ActiveRun = {
  runName: string;
  runPath: string;
  ticketsPath: string;
  finalReportPath: string;
};

export type TicketRunPaths = {
  runDir: string;
  ticketMarkdownPath: string;
  goldPatchPath: string;
  candidatePatchPath: string;
  solverOutputPath: string;
  solverRawLogPath: string;
  solverStdoutLogPath: string;
  solverStderrLogPath: string;
  judgeInputPath: string;
  judgeOutputPath: string;
  opencodeLogPath: string;
  judgeRawLogPath: string;
  judgeStdoutLogPath: string;
  judgeStderrLogPath: string;
  scorePath: string;
};
