export class ReportWorkflow {
    reportGenerator;
    constructor(reportGenerator) {
        this.reportGenerator = reportGenerator;
    }
    async writeFinalReport(scores, tickets) {
        return this.reportGenerator.generate(scores, tickets);
    }
}
