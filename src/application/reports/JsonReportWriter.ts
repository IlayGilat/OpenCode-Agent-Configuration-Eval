import path from "node:path";
import type { ReportModel } from "../../domain/domain.js";
import { FileSystem } from "../../infrastructure/filesystem/FileSystem.js";

export class JsonReportWriter {
  constructor(
    private readonly reportsPath: string,
    private readonly fileSystem: FileSystem,
  ) {}

  async write(report: ReportModel): Promise<void> {
    await this.fileSystem.writeJson(path.join(this.reportsPath, "results.json"), report);
  }
}
