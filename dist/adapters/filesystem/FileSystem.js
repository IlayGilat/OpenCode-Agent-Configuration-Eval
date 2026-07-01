import fs from "node:fs/promises";
import path from "node:path";
export class FileSystem {
    async exists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
    async readText(filePath) {
        return fs.readFile(filePath, "utf8");
    }
    async writeText(filePath, content) {
        await this.ensureDir(path.dirname(filePath));
        await fs.writeFile(filePath, content, "utf8");
    }
    async readJson(filePath) {
        return JSON.parse(await this.readText(filePath));
    }
    async writeJson(filePath, value) {
        await this.writeText(filePath, `${JSON.stringify(value, null, 2)}\n`);
    }
    async ensureDir(dirPath) {
        await fs.mkdir(dirPath, { recursive: true });
    }
    async readDirectory(dirPath) {
        try {
            return await fs.readdir(dirPath);
        }
        catch (error) {
            if (error.code === "ENOENT") {
                return [];
            }
            throw error;
        }
    }
    async readDirectoryStats(dirPath) {
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            return Promise.all(entries.map(async (entry) => {
                const stats = await fs.stat(path.join(dirPath, entry.name));
                return {
                    name: entry.name,
                    isDirectory: entry.isDirectory(),
                    mtimeMs: stats.mtimeMs,
                };
            }));
        }
        catch (error) {
            if (error.code === "ENOENT") {
                return [];
            }
            throw error;
        }
    }
}
