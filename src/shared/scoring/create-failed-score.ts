import type { JudgeResult } from "../../interfaces/scoring/interfaces.js";
import { compactErrorMessage } from "../errors/errors.js";

type FailurePhase = NonNullable<JudgeResult["failurePhase"]>;

export function createFailedScore(
  taskId: string,
  error: unknown,
  options: {
    failureType: string;
    failurePhase: FailurePhase;
    fallbackSummary?: string;
    failureMessageFallback?: string;
  },
): JudgeResult {
  const message = compactErrorMessage(error, options.failureMessageFallback);

  return {
    taskId,
    score: 0,
    verdict: "fail",
    solve_probability: 0,
    gold_alignment: 0,
    repo_pattern_quality: 0,
    minimality: 0,
    risk: 100,
    would_i_merge: false,
    summary: `${options.fallbackSummary ?? "Ticket execution failed before judging"}: ${message}`,
    strengths: [],
    problems: [message],
    failureType: options.failureType,
    failurePhase: options.failurePhase,
    failureMessage: message,
  };
}
