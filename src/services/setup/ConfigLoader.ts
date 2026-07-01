import path from "node:path";
import dotenv from "dotenv";
import type { EvalConfig } from "../../interfaces/config/interfaces.js";
import { evalConfigSchema } from "../../interfaces/config/schemas.js";
import { FileSystem } from "../platform/FileSystem.js";

export class ConfigLoader {
  private static readonly defaults = {
    repoPath: "./sample-repo",
    runsPath: "./runs",
    opencodeCommand: "opencode",
    model: "opencode/deepseek-v4-flash-free",
    timeoutMs: 60 * 60 * 1000,
    solverPromptPath: "src/prompts/solver.md",
    judgePromptPath: "src/prompts/judge.md",
  };

  constructor(
    private readonly fileSystem: FileSystem,
    private readonly envPath = ".env",
  ) {}

  async load(): Promise<EvalConfig> {
    const projectRoot = process.cwd();
    dotenv.config({ path: path.resolve(this.envPath), quiet: true });

    const parsed = evalConfigSchema.parse({
      ...ConfigLoader.defaults,
      repoPath: this.envValueOrDefault(process.env.REPO_PATH, ConfigLoader.defaults.repoPath),
      runsPath: this.envValueOrDefault(process.env.RUNS_PATH, ConfigLoader.defaults.runsPath),
      configuredRunName: this.optionalEnvValue(process.env.CONFIGURED_RUN_NAME),
      model: this.envValueOrDefault(process.env.MODEL, ConfigLoader.defaults.model),
      timeoutMs: this.numberEnvValueOrDefault(process.env.TIMEOUT_MS, ConfigLoader.defaults.timeoutMs),
    });

    const config: EvalConfig = {
      ...parsed,
      repoPath: this.resolveConfigPath(projectRoot, parsed.repoPath),
      runsPath: this.resolveConfigPath(projectRoot, parsed.runsPath),
      configuredRunName: parsed.configuredRunName,
      solverPromptPath: this.resolveConfigPath(projectRoot, parsed.solverPromptPath),
      judgePromptPath: this.resolveConfigPath(projectRoot, parsed.judgePromptPath),
    };

    if (!(await this.fileSystem.exists(config.repoPath))) {
      throw new Error(`repoPath does not exist: ${config.repoPath}`);
    }

    if (!(await this.fileSystem.exists(config.solverPromptPath))) {
      throw new Error(`solverPromptPath does not exist: ${config.solverPromptPath}`);
    }

    if (!(await this.fileSystem.exists(config.judgePromptPath))) {
      throw new Error(`judgePromptPath does not exist: ${config.judgePromptPath}`);
    }

    return config;
  }

  private optionalEnvValue(value: string | undefined): string | null {
    return value?.trim() || null;
  }

  private envValueOrDefault(value: string | undefined, defaultValue: string): string {
    return value?.trim() || defaultValue;
  }

  private numberEnvValueOrDefault(value: string | undefined, defaultValue: number): number {
    const trimmed = value?.trim();

    if (!trimmed) {
      return defaultValue;
    }

    const parsed = Number(trimmed);

    if (!Number.isFinite(parsed)) {
      throw new Error(`TIMEOUT_MS must be a finite number, received: ${trimmed}`);
    }

    return parsed;
  }

  private resolveConfigPath(configDir: string, configuredPath: string): string {
    return path.isAbsolute(configuredPath)
      ? path.normalize(configuredPath)
      : path.resolve(configDir, configuredPath);
  }
}
