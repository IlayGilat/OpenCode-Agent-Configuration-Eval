import path from "node:path";
import type { ReportModel } from "../../../interfaces/reports/interfaces.js";
import { FileSystem } from "../../../adapters/filesystem/file-system.js";

export class JsonReportWriter {
  constructor(
    private readonly reportsPath: string,
    private readonly fileSystem: FileSystem,
  ) {}

  async write(report: ReportModel): Promise<void> {
    await this.fileSystem.writeJson(path.join(this.reportsPath, "results.json"), report);
  }
}
