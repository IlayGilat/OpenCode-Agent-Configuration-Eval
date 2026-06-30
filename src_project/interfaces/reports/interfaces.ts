import type { EvalSummary } from "../scoring/interfaces.js";

export type RunResult = {
  taskId: string;
  title: string;
  score: number;
  verdict: string;
  wouldIMerge: boolean;
  summary: string;
};

export type ReportModel = {
  summary: EvalSummary;
  tickets: RunResult[];
  executiveSummary: string;
  commonStrengths: string[];
  commonProblems: string[];
  recommendations: string[];
};
