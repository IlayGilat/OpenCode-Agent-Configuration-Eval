import crypto from "node:crypto";
import path from "node:path";
import type { EvalConfig } from "../../interfaces/config/interfaces.js";
import type { ActiveRun } from "../../interfaces/evaluation/interfaces.js";
import { FileSystem } from "../../adapters/filesystem/file-system.js";
import { toKebabCase } from "../../shared/text/to-kebab-case.js";

export class RunContext {
  constructor(
    private readonly config: EvalConfig,
    private readonly fileSystem: FileSystem,
  ) {}

  createNew(runName?: string): ActiveRun {
    const selectedRunName = runName ?? this.config.configuredRunName ?? crypto.randomUUID();
    return this.createFromName(selectedRunName);
  }

  async resolveExisting(runName?: string): Promise<ActiveRun> {
    const selectedRunName = runName ?? this.config.configuredRunName;

    if (selectedRunName) {
      return this.createFromName(selectedRunName);
    }

    const latest = (await this.fileSystem.readDirectoryStats(this.config.runsPath))
      .filter((entry) => entry.isDirectory)
      .filter((entry) => entry.name !== "artifacts" && entry.name !== "reports" && entry.name !== "workspaces")
      .sort((left, right) => right.mtimeMs - left.mtimeMs)[0];

    if (!latest) {
      throw new Error("No existing runs found. Run an evaluation first or pass --run-name.");
    }

    return this.createFromName(latest.name);
  }

  private createFromName(selectedRunName: string): ActiveRun {
    const runName = toKebabCase(selectedRunName);
    const runPath = path.join(this.config.runsPath, runName);

    return {
      runName,
      runPath,
      ticketsPath: path.join(runPath, "tickets"),
      finalReportPath: path.join(runPath, "final-report"),
    };
  }
}
