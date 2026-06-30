import path from "node:path";
import type { ReportModel } from "../../../interfaces/reports/interfaces.js";
import { FileSystem } from "../../platform/FileSystem.js";

export class MarkdownReportWriter {
  constructor(
    private readonly reportsPath: string,
    private readonly fileSystem: FileSystem,
  ) {}

  async write(report: ReportModel): Promise<void> {
    const summary = report.summary;
    const lines = [
      "# OpenCode Local Agent Evaluation Summary",
      "",
      "## Executive Summary",
      "",
      report.executiveSummary,
      "",
      "## Metrics",
      "",
      `- Total tickets: ${summary.totalTickets}`,
      `- Completed: ${summary.completed}`,
      `- Median score: ${summary.medianScore}`,
      `- Average score: ${summary.averageScore}`,
      `- Would-merge rate: ${(summary.wouldMergeRate * 100).toFixed(1)}%`,
      "",
      "## Verdict Distribution",
      "",
      `- Excellent: ${summary.verdictDistribution.excellent}`,
      `- Good: ${summary.verdictDistribution.good}`,
      `- Partial: ${summary.verdictDistribution.partial}`,
      `- Weak: ${summary.verdictDistribution.weak}`,
      `- Fail: ${summary.verdictDistribution.fail}`,
      "",
      "## Score Table",
      "",
      "| Task | Score | Verdict | Would Merge | Summary |",
      "| --- | ---: | --- | --- | --- |",
      ...report.tickets.map(
        (ticket) =>
          `| ${ticket.taskId} | ${ticket.score} | ${ticket.verdict} | ${ticket.wouldIMerge ? "yes" : "no"} | ${ticket.summary.replaceAll("|", "\\|")} |`,
      ),
      "",
      "## Common Strengths",
      "",
      ...this.listOrFallback(report.commonStrengths),
      "",
      "## Common Problems",
      "",
      ...this.listOrFallback(report.commonProblems),
      "",
      "## Recommendations",
      "",
      ...this.listOrFallback(report.recommendations),
      "",
    ];

    await this.fileSystem.writeText(path.join(this.reportsPath, "summary.md"), lines.join("\n"));
  }

  private listOrFallback(items: string[]): string[] {
    return items.length ? items.map((item) => `- ${item}`) : ["- No recurring items found yet."];
  }
}
