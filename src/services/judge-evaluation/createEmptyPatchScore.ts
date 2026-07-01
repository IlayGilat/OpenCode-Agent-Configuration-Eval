import type { JudgeResult } from "../../interfaces/scoring/interfaces.js";

export function createEmptyPatchScore(taskId: string): JudgeResult {
  return {
    taskId,
    score: 0,
    verdict: "fail",
    solve_probability: 0,
    gold_alignment: 0,
    repo_pattern_quality: 0,
    minimality: 100,
    risk: 0,
    would_i_merge: false,
    summary: "The solver produced no candidate patch.",
    strengths: [],
    problems: ["No repository changes were made."],
  };
}
