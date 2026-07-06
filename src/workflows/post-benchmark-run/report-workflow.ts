import type { ReportModel } from "../../interfaces/reports/interfaces.js";
import type { JudgeResult } from "../../interfaces/scoring/interfaces.js";
import type { JiraTicket } from "../../interfaces/tickets/interfaces.js";
import { ReportGenerator } from "../../services/result-reporting/generation/report-generator.js";

export class ReportWorkflow {
  constructor(
    private readonly reportGenerator: ReportGenerator,
  ) {}

  async writeFinalReport(scores: JudgeResult[], tickets: JiraTicket[]): Promise<ReportModel> {
    return this.reportGenerator.generate(scores, tickets);
  }
}
