export type EvalConfig = {
  repoPath: string;
  runsPath: string;
  configuredRunName: string | null;
  gitCommand: string;
  opencodeCommand: string;
  model: string;
  timeoutMinutes: number;
  solverPromptPath: string;
  judgePromptPath: string;
};

export type ActiveRun = {
  runName: string;
  runPath: string;
  ticketsPath: string;
  workspacesPath: string;
  finalReportPath: string;
};

export type JiraTicket = {
  id: string;
  title: string;
  description: string;
  baseCommit: string;
  goldCommit: string;
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

export type Verdict = "fail" | "weak" | "partial" | "good" | "excellent";

export type JudgeResult = {
  taskId: string;
  score: number;
  verdict: Verdict;
  solve_probability: number;
  gold_alignment: number;
  repo_pattern_quality: number;
  minimality: number;
  risk: number;
  would_i_merge: boolean;
  summary: string;
  strengths: string[];
  problems: string[];
};

export type RunResult = {
  taskId: string;
  title: string;
  score: number;
  verdict: string;
  wouldIMerge: boolean;
  summary: string;
};

export type VerdictDistribution = {
  excellent: number;
  good: number;
  partial: number;
  weak: number;
  fail: number;
};

export type EvalSummary = {
  totalTickets: number;
  completed: number;
  medianScore: number;
  averageScore: number;
  wouldMergeRate: number;
  verdictDistribution: VerdictDistribution;
};

export type ReportModel = {
  summary: EvalSummary;
  tickets: RunResult[];
  executiveSummary: string;
  commonStrengths: string[];
  commonProblems: string[];
  recommendations: string[];
};

export type ProcessOptions = {
  cwd?: string;
  timeoutMs?: number;
  onStdout?: (chunk: string) => void;
  onStderr?: (chunk: string) => void;
  onRawOutput?: (chunk: string) => void;
};

export type ProcessResult = {
  stdout: string;
  stderr: string;
  rawOutput: string;
};

export type OpenCodeRunResult = ProcessResult & {
  combinedOutput: string;
};

export type OpenCodeLogPaths = {
  rawPath: string;
  stdoutPath: string;
  stderrPath: string;
  transcriptPath: string;
  phase: "solver" | "judge";
};
