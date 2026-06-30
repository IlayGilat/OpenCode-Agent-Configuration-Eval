import type { z } from "zod";
import type { judgeResultSchema } from "./schemas.js";

export type JudgeResult = z.infer<typeof judgeResultSchema>;
export type Verdict = JudgeResult["verdict"];

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
