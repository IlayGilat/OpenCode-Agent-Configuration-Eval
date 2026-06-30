import type { JudgeResult } from "../../domain/domain.js";
import { RunRepository } from "../evaluation/RunRepository.js";

const verdicts = ["fail", "weak", "partial", "good", "excellent"] as const;

export class RandomScoreSeeder {
  constructor(private readonly runRepository: RunRepository) {}

  async seed(count: number): Promise<JudgeResult[]> {
    const scores: JudgeResult[] = [];

    for (let index = 1; index <= count; index += 1) {
      const taskId = `RANDOM-${String(index).padStart(3, "0")}`;
      const score = this.makeScore(taskId);
      await this.runRepository.createRunFolder(taskId);
      await this.runRepository.writeScore(taskId, score);
      scores.push(score);
    }

    return scores;
  }

  private makeScore(taskId: string): JudgeResult {
    const score = Math.floor(Math.random() * 101);
    const verdict =
      score >= 90 ? "excellent" : score >= 75 ? "good" : score >= 50 ? "partial" : score >= 25 ? "weak" : "fail";

    return {
      taskId,
      score,
      verdict: verdicts.includes(verdict) ? verdict : "fail",
      solve_probability: this.randomMetric(score),
      gold_alignment: this.randomMetric(score),
      repo_pattern_quality: this.randomMetric(score),
      minimality: this.randomMetric(score),
      risk: Math.max(0, 100 - this.randomMetric(score)),
      would_i_merge: score >= 75,
      summary: `Random smoke score for ${taskId}.`,
      strengths: score >= 50 ? ["Made plausible progress", "Followed a simple path"] : [],
      problems: score < 75 ? ["Needs closer alignment with the gold patch"] : [],
    };
  }

  private randomMetric(center: number): number {
    const jitter = Math.floor(Math.random() * 31) - 15;
    return Math.max(0, Math.min(100, center + jitter));
  }
}
