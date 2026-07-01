import path from "node:path";
import type { ReportModel } from "../../../interfaces/reports/interfaces.js";
import { FileSystem } from "../../../adapters/filesystem/FileSystem.js";

export class CsvReportWriter {
  constructor(
    private readonly reportsPath: string,
    private readonly fileSystem: FileSystem,
  ) {}

  async write(report: ReportModel): Promise<void> {
    const rows = [
      ["taskId", "title", "score", "verdict", "wouldIMerge", "status", "failureType", "failurePhase", "summary"],
      ...report.tickets.map((ticket) => [
        ticket.taskId,
        ticket.title,
        String(ticket.score),
        ticket.verdict,
        String(ticket.wouldIMerge),
        ticket.status,
        ticket.failureType,
        ticket.failurePhase,
        ticket.summary,
      ]),
    ];

    const csv = rows.map((row) => row.map(this.escapeCell).join(",")).join("\n");
    await this.fileSystem.writeText(path.join(this.reportsPath, "results.csv"), `${csv}\n`);
  }

  private escapeCell(cell: string): string {
    if (!/[",\n\r]/.test(cell)) {
      return cell;
    }

    return `"${cell.replaceAll("\"", "\"\"")}"`;
  }
}
