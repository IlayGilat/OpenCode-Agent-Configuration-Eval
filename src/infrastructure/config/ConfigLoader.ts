import path from "node:path";
import type { EvalConfig } from "../../domain/domain.js";
import { FileSystem } from "../filesystem/FileSystem.js";
import { evalConfigSchema } from "./schemas.js";

export class ConfigLoader {
  constructor(
    private readonly fileSystem: FileSystem,
    private readonly configPath = "configurations/eval.config.json",
  ) {}

  async load(): Promise<EvalConfig> {
    const absoluteConfigPath = path.resolve(this.configPath);
    const configDir = path.dirname(absoluteConfigPath);
    const raw = await this.fileSystem.readJson(absoluteConfigPath);
    const parsed = evalConfigSchema.parse(raw);
    const config: EvalConfig = {
      ...parsed,
      repoPath: path.resolve(configDir, parsed.repoPath),
      runsPath: path.resolve(configDir, parsed.runsPath),
      configuredRunName: parsed.configuredRunName,
      solverPromptPath: path.resolve(configDir, parsed.solverPromptPath),
      judgePromptPath: path.resolve(configDir, parsed.judgePromptPath),
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
