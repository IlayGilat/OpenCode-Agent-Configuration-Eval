import path from "node:path";
import type { ReportModel } from "../../../interfaces/reports/interfaces.js";
import { FileSystem } from "../../../adapters/filesystem/file-system.js";

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
      "| Task | Score | Verdict | Status | Failure | Would Merge | Summary |",
      "| --- | ---: | --- | --- | --- | --- | --- |",
      ...report.tickets.map(
        (ticket) =>
          `| ${ticket.taskId} | ${ticket.score} | ${ticket.verdict} | ${ticket.status} | ${this.escapeTableCell(ticket.failureType || "-")} | ${ticket.wouldIMerge ? "yes" : "no"} | ${this.escapeTableCell(this.truncate(ticket.summary, 280))} |`,
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
    return items.length ? items.map((item) => `- ${this.truncate(item, 280)}`) : ["- No recurring items found yet."];
  }

  private escapeTableCell(value: string): string {
    return value.replaceAll("|", "\\|").replace(/\s+/g, " ").trim();
  }

  private truncate(value: string, maxLength: number): string {
    if (value.length <= maxLength) {
      return value;
    }

    return `${value.slice(0, maxLength - 3)}...`;
  }
}
