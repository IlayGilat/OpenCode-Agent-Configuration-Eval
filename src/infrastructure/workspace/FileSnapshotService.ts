import fs from "node:fs/promises";
import path from "node:path";

type FileSnapshot = Map<string, { hash: string; size: number }>;

const excludedDirs = new Set(["node_modules", ".git", "runs", "dist", ".next", "coverage"]);

export class FileSnapshotService {
  async snapshot(rootPath: string): Promise<FileSnapshot> {
    const snapshot: FileSnapshot = new Map();
    await this.walk(rootPath, rootPath, snapshot);
    return snapshot;
  }

  async describeChanges(before: FileSnapshot, after: FileSnapshot): Promise<string> {
    const added = [...after.keys()].filter((filePath) => !before.has(filePath)).sort();
    const deleted = [...before.keys()].filter((filePath) => !after.has(filePath)).sort();
    const modified = [...after.keys()]
      .filter((filePath) => before.has(filePath) && before.get(filePath)?.hash !== after.get(filePath)?.hash)
      .sort();

    if (!added.length && !deleted.length && !modified.length) {
      return "";
    }

    return [
      "# Candidate Change Report",
      "",
      `Added files: ${added.length}`,
      ...added.map((filePath) => `+ ${filePath}`),
      "",
      `Modified files: ${modified.length}`,
      ...modified.map((filePath) => `~ ${filePath}`),
      "",
      `Deleted files: ${deleted.length}`,
      ...deleted.map((filePath) => `- ${filePath}`),
      "",
    ].join("\n");
  }

  private async walk(rootPath: string, currentPath: string, snapshot: FileSnapshot): Promise<void> {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory() && excludedDirs.has(entry.name)) {
        continue;
      }

      const absolutePath = path.join(currentPath, entry.name);

      if (entry.isDirectory()) {
        await this.walk(rootPath, absolutePath, snapshot);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      const buffer = await fs.readFile(absolutePath);
      const relativePath = path.relative(rootPath, absolutePath);
      snapshot.set(relativePath, {
        hash: await this.hash(buffer),
        size: buffer.byteLength,
      });
    }
  }

  private async hash(buffer: Buffer): Promise<string> {
    const { createHash } = await import("node:crypto");
    return createHash("sha256").update(buffer).digest("hex");
  }
}
