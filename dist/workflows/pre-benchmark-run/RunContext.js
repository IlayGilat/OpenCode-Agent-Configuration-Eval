import crypto from "node:crypto";
import path from "node:path";
export class RunContext {
    config;
    fileSystem;
    constructor(config, fileSystem) {
        this.config = config;
        this.fileSystem = fileSystem;
    }
    createNew(runName) {
        const selectedRunName = runName ?? this.config.configuredRunName ?? crypto.randomUUID();
        return this.createFromName(selectedRunName);
    }
    async resolveExisting(runName) {
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
    createFromName(selectedRunName) {
        const runPath = path.join(this.config.runsPath, selectedRunName);
        return {
            runName: selectedRunName,
            runPath,
            ticketsPath: path.join(runPath, "tickets"),
            finalReportPath: path.join(runPath, "final-report"),
        };
    }
}
