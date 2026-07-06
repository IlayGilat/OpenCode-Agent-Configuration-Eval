import type { JudgeResult } from "../../../interfaces/scoring/interfaces.js";

export function buildExecutiveSummary(scores: JudgeResult[]): string {
  if (!scores.length) {
    return "No completed ticket scores are available yet.";
  }

  const average =
    scores.reduce((sum, score) => sum + score.score, 0) / Math.max(scores.length, 1);
  const mergeable = scores.filter((score) => score.would_i_merge).length;

  return `Evaluated ${scores.length} tickets. The average score is ${average.toFixed(1)}, with ${mergeable} candidate patches marked mergeable.`;
}

export function topItems(items: string[], limit = 5): string[] {
  const counts = new Map<string, number>();

  for (const item of items.filter(Boolean)) {
    counts.set(item, (counts.get(item) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([item]) => item);
}

export function buildRecommendations(scores: JudgeResult[]): string[] {
  if (!scores.length) {
    return ["Run at least one ticket evaluation, then regenerate the report."];
  }

  const weakScores = scores.filter((score) => score.score < 75);
  const recommendations = new Set<string>();

  if (weakScores.length) {
    recommendations.add("Review weak and failed runs to identify missing repo instructions in AGENTS.md.");
    recommendations.add("Add or refine skills for repeated implementation patterns found in real tickets.");
  }

  if (scores.some((score) => score.repo_pattern_quality < 70)) {
    recommendations.add("Improve repo convention documentation so the solver can match existing patterns more reliably.");
  }

  if (scores.some((score) => score.risk > 60)) {
    recommendations.add("Tighten prompts and repo guidance around minimal changes and risk checks.");
  }

  if (!recommendations.size) {
    recommendations.add("The current setup looks healthy on these sampled tickets; keep expanding the ticket set.");
  }

  return [...recommendations];
}
