import path from "node:path";
import dotenv from "dotenv";
import type { EvalConfig } from "../../../interfaces/config/interfaces.js";
import { evalConfigSchema } from "../../../interfaces/config/schemas.js";
import { FileSystem } from "../../../adapters/filesystem/file-system.js";
import { resolveConfigPath } from "./config-paths.js";
import { envValueOrDefault, numberEnvValueOrDefault, optionalEnvValue } from "./env-parsing.js";

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
      repoPath: envValueOrDefault(process.env.REPO_PATH, ConfigLoader.defaults.repoPath),
      runsPath: envValueOrDefault(process.env.RUNS_PATH, ConfigLoader.defaults.runsPath),
      configuredRunName: optionalEnvValue(process.env.CONFIGURED_RUN_NAME),
      model: envValueOrDefault(process.env.MODEL, ConfigLoader.defaults.model),
      timeoutMs: numberEnvValueOrDefault(process.env.TIMEOUT_MS, ConfigLoader.defaults.timeoutMs, "TIMEOUT_MS"),
    });

    const config: EvalConfig = {
      ...parsed,
      repoPath: resolveConfigPath(projectRoot, parsed.repoPath),
      runsPath: resolveConfigPath(projectRoot, parsed.runsPath),
      configuredRunName: parsed.configuredRunName,
      solverPromptPath: resolveConfigPath(projectRoot, parsed.solverPromptPath),
      judgePromptPath: resolveConfigPath(projectRoot, parsed.judgePromptPath),
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
}
