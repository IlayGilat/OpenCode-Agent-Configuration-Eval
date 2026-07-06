import type { ReportModel } from "../../../interfaces/reports/interfaces.js";
import type { JudgeResult } from "../../../interfaces/scoring/interfaces.js";
import type { JiraTicket } from "../../../interfaces/tickets/interfaces.js";
import { buildExecutiveSummary, buildRecommendations, topItems } from "./report-text.js";
import { CsvReportWriter } from "../writers/csv-report-writer.js";
import { JsonReportWriter } from "../writers/json-report-writer.js";
import { MarkdownReportWriter } from "../writers/markdown-report-writer.js";
import { ScoreAggregator } from "../score-aggregator.js";

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
        status: score.failureType ? "bench-failed" : "evaluated",
        failureType: score.failureType ?? "",
        failurePhase: score.failurePhase ?? "",
        summary: score.summary,
      })),
      executiveSummary: buildExecutiveSummary(scores),
      commonStrengths: topItems(scores.flatMap((score) => score.strengths)),
      commonProblems: topItems(scores.flatMap((score) => score.problems)),
      recommendations: buildRecommendations(scores),
    };

    await this.jsonReportWriter.write(report);
    await this.csvReportWriter.write(report);
    await this.markdownReportWriter.write(report);

    return report;
  }
}
