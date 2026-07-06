import path from "node:path";

export function resolveConfigPath(configDir: string, configuredPath: string): string {
  return path.isAbsolute(configuredPath)
    ? path.normalize(configuredPath)
    : path.resolve(configDir, configuredPath);
}
