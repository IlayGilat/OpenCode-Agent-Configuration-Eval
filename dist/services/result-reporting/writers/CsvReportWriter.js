import path from "node:path";
export class CsvReportWriter {
    reportsPath;
    fileSystem;
    constructor(reportsPath, fileSystem) {
        this.reportsPath = reportsPath;
        this.fileSystem = fileSystem;
    }
    async write(report) {
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
    escapeCell(cell) {
        if (!/[",\n\r]/.test(cell)) {
            return cell;
        }
        return `"${cell.replaceAll("\"", "\"\"")}"`;
    }
}
