import fs from "node:fs/promises";
import path from "node:path";

export class FileSystem {
  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async readText(filePath: string): Promise<string> {
    return fs.readFile(filePath, "utf8");
  }

  async writeText(filePath: string, content: string): Promise<void> {
    await this.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, content, "utf8");
  }

  async readJson(filePath: string): Promise<unknown> {
    return JSON.parse(await this.readText(filePath));
  }

  async writeJson(filePath: string, value: unknown): Promise<void> {
    await this.writeText(filePath, `${JSON.stringify(value, null, 2)}\n`);
  }

  async ensureDir(dirPath: string): Promise<void> {
    await fs.mkdir(dirPath, { recursive: true });
  }

  async removeDir(dirPath: string): Promise<void> {
    await fs.rm(dirPath, { recursive: true, force: true });
  }

  async copyDir(sourcePath: string, destinationPath: string): Promise<void> {
    await this.ensureDir(path.dirname(destinationPath));
    await fs.cp(sourcePath, destinationPath, {
      recursive: true,
      force: true,
      filter: (source) => {
        const normalized = source.replaceAll("\\", "/");
        return ![
          "/node_modules",
          "/.git",
          "/runs",
          "/dist",
          "/.next",
          "/coverage",
        ].some((excluded) => normalized.includes(excluded));
      },
    });
  }

  async readDirectory(dirPath: string): Promise<string[]> {
    try {
      return await fs.readdir(dirPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return [];
      }

      throw error;
    }
  }

  async readDirectoryStats(dirPath: string): Promise<Array<{ name: string; isDirectory: boolean; mtimeMs: number }>> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      return Promise.all(
        entries.map(async (entry) => {
          const stats = await fs.stat(path.join(dirPath, entry.name));
          return {
            name: entry.name,
            isDirectory: entry.isDirectory(),
            mtimeMs: stats.mtimeMs,
          };
        }),
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return [];
      }

      throw error;
    }
  }
}
