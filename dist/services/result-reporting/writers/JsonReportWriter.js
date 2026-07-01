import path from "node:path";
export class JsonReportWriter {
    reportsPath;
    fileSystem;
    constructor(reportsPath, fileSystem) {
        this.reportsPath = reportsPath;
        this.fileSystem = fileSystem;
    }
    async write(report) {
        await this.fileSystem.writeJson(path.join(this.reportsPath, "results.json"), report);
    }
}
