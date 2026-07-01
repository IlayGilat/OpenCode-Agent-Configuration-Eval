export type ActiveRun = {
  runName: string;
  runPath: string;
  ticketsPath: string;
  finalReportPath: string;
};

export type TicketRunPaths = {
  runDir: string;
  inputDir: string;
  patchesDir: string;
  outputDir: string;
  resultDir: string;
  solverLogsDir: string;
  judgeLogsDir: string;
  ticketMarkdownPath: string;
  solverPromptPath: string;
  goldPatchPath: string;
  candidatePatchPath: string;
  solverOutputPath: string;
  solverRawLogPath: string;
  solverStdoutLogPath: string;
  solverStderrLogPath: string;
  judgePromptPath: string;
  judgeOutputPath: string;
  opencodeLogPath: string;
  judgeRawLogPath: string;
  judgeStdoutLogPath: string;
  judgeStderrLogPath: string;
  scorePath: string;
  failurePath: string;
};
