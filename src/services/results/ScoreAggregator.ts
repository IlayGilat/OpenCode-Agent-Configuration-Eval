import type { EvalSummary, JudgeResult, VerdictDistribution } from "../../interfaces/scoring/interfaces.js";

export class ScoreAggregator {
  aggregate(scores: JudgeResult[]): EvalSummary {
    const scoreValues = scores.map((score) => score.score);
    const verdictDistribution: VerdictDistribution = {
      excellent: 0,
      good: 0,
      partial: 0,
      weak: 0,
      fail: 0,
    };

    for (const score of scores) {
      verdictDistribution[score.verdict] += 1;
    }

    return {
      totalTickets: scores.length,
      completed: scores.length,
      medianScore: this.median(scoreValues),
      averageScore: this.average(scoreValues),
      wouldMergeRate: scores.length
        ? scores.filter((score) => score.would_i_merge).length / scores.length
        : 0,
      verdictDistribution,
    };
  }

  median(scores: number[]): number {
    if (!scores.length) {
      return 0;
    }

    const sorted = [...scores].sort((left, right) => left - right);
    const middle = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return this.round((sorted[middle - 1] + sorted[middle]) / 2);
    }

    return this.round(sorted[middle]);
  }

  average(scores: number[]): number {
    if (!scores.length) {
      return 0;
    }

    return this.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
