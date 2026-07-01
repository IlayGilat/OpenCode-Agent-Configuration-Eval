import path from "node:path";
export class MarkdownReportWriter {
    reportsPath;
    fileSystem;
    constructor(reportsPath, fileSystem) {
        this.reportsPath = reportsPath;
        this.fileSystem = fileSystem;
    }
    async write(report) {
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
            ...report.tickets.map((ticket) => `| ${ticket.taskId} | ${ticket.score} | ${ticket.verdict} | ${ticket.status} | ${this.escapeTableCell(ticket.failureType || "-")} | ${ticket.wouldIMerge ? "yes" : "no"} | ${this.escapeTableCell(this.truncate(ticket.summary, 280))} |`),
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
    listOrFallback(items) {
        return items.length ? items.map((item) => `- ${this.truncate(item, 280)}`) : ["- No recurring items found yet."];
    }
    escapeTableCell(value) {
        return value.replaceAll("|", "\\|").replace(/\s+/g, " ").trim();
    }
    truncate(value, maxLength) {
        if (value.length <= maxLength) {
            return value;
        }
        return `${value.slice(0, maxLength - 3)}...`;
    }
}
