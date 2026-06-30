import type { ReportModel } from "../../interfaces/reports/interfaces.js";
import type { JudgeResult } from "../../interfaces/scoring/interfaces.js";
import type { JiraTicket } from "../../interfaces/tickets/interfaces.js";
import { CsvReportWriter } from "./writers/CsvReportWriter.js";
import { JsonReportWriter } from "./writers/JsonReportWriter.js";
import { MarkdownReportWriter } from "./writers/MarkdownReportWriter.js";
import { ScoreAggregator } from "../scoring/ScoreAggregator.js";

export class ReportGenerator {
  constructor(
    private readonly scoreAggregator: ScoreAggregator,
    private readonly markdownReportWriter: MarkdownReportWriter,
    private readonly csvReportWriter: CsvReportWriter,
    private readonly jsonReportWriter: JsonReportWriter,
  ) {}

  async generate(scores: JudgeResult[], tickets: JiraTicket[] = []): Promise<ReportModel> {
    const titlesById = new Map(tickets.map((ticket) => [ticket.id, ticket.title]));
    const report: ReportModel = {
      summary: this.scoreAggregator.aggregate(scores),
      tickets: scores.map((score) => ({
        taskId: score.taskId,
        title: titlesById.get(score.taskId) ?? score.taskId,
        score: score.score,
        verdict: score.verdict,
        wouldIMerge: score.would_i_merge,
        summary: score.summary,
      })),
      executiveSummary: this.buildExecutiveSummary(scores),
      commonStrengths: this.topItems(scores.flatMap((score) => score.strengths)),
      commonProblems: this.topItems(scores.flatMap((score) => score.problems)),
      recommendations: this.buildRecommendations(scores),
    };

    await this.jsonReportWriter.write(report);
    await this.csvReportWriter.write(report);
    await this.markdownReportWriter.write(report);

    return report;
  }

  private buildExecutiveSummary(scores: JudgeResult[]): string {
    if (!scores.length) {
      return "No completed ticket scores are available yet.";
    }

    const average =
      scores.reduce((sum, score) => sum + score.score, 0) / Math.max(scores.length, 1);
    const mergeable = scores.filter((score) => score.would_i_merge).length;

    return `Evaluated ${scores.length} tickets. The average score is ${average.toFixed(1)}, with ${mergeable} candidate patches marked mergeable.`;
  }

  private topItems(items: string[], limit = 5): string[] {
    const counts = new Map<string, number>();

    for (const item of items.filter(Boolean)) {
      counts.set(item, (counts.get(item) ?? 0) + 1);
    }

    return [...counts.entries()]
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .slice(0, limit)
      .map(([item]) => item);
  }

  private buildRecommendations(scores: JudgeResult[]): string[] {
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
}
