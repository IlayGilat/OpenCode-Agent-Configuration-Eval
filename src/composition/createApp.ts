import type { EvalConfig } from "../interfaces/config/interfaces.js";
import { ConfigLoader } from "../services/config/ConfigLoader.js";
import { RunContext } from "../services/evaluation/RunContext.js";
import { RunPaths } from "../services/evaluation/RunPaths.js";
import { RunRepository } from "../services/evaluation/RunRepository.js";
import { RunService } from "../services/evaluation/RunService.js";
import { OpenCodeRunner } from "../services/opencode/OpenCodeRunner.js";
import { OpenCodeTaskRunner } from "../services/opencode/OpenCodeTaskRunner.js";
import { ReportGenerator } from "../services/reports/ReportGenerator.js";
import { CsvReportWriter } from "../services/reports/writers/CsvReportWriter.js";
import { JsonReportWriter } from "../services/reports/writers/JsonReportWriter.js";
import { MarkdownReportWriter } from "../services/reports/writers/MarkdownReportWriter.js";
import { JudgePromptBuilder } from "../services/scoring/JudgePromptBuilder.js";
import { JudgeResultParser } from "../services/scoring/JudgeResultParser.js";
import { ScoreAggregator } from "../services/scoring/ScoreAggregator.js";
import { FileSystem } from "../services/system/FileSystem.js";
import { ProcessRunner } from "../services/system/ProcessRunner.js";
import { TicketLoader } from "../services/tickets/TicketLoader.js";
import { TicketPromptBuilder } from "../services/tickets/TicketPromptBuilder.js";
import { GitService } from "../services/workspace/GitService.js";
import { PatchService } from "../services/workspace/PatchService.js";
import { WorkspaceService } from "../services/workspace/WorkspaceService.js";

export type AppServices = {
  config: EvalConfig;
  runName: string;
  runPath: string;
  logger: Pick<typeof console, "info" | "warn" | "error">;
  ticketLoader: TicketLoader;
  runRepository: RunRepository;
  runService: RunService;
  reportGenerator: ReportGenerator;
  workspaceService: WorkspaceService;
};

export async function createApp(options: { runName?: string; existingRun?: boolean } = {}): Promise<AppServices> {
  const fileSystem = new FileSystem();
  const processRunner = new ProcessRunner();
  const logger = console;
  const config = await new ConfigLoader(fileSystem).load();
  const runContext = new RunContext(config, fileSystem);
  const activeRun = options.existingRun
    ? await runContext.resolveExisting(options.runName)
    : runContext.createNew(options.runName);
  const ticketPromptBuilder = new TicketPromptBuilder(
    fileSystem,
    config.solverPromptPath,
  );
  const ticketLoader = new TicketLoader(fileSystem);
  const gitService = new GitService(processRunner);
  const workspaceService = new WorkspaceService(config, gitService);
  const patchService = new PatchService(config, gitService);
  const openCodeRunner = new OpenCodeRunner(config, processRunner);
  const openCodeTaskRunner = new OpenCodeTaskRunner(ticketPromptBuilder, openCodeRunner);
  const judgePromptBuilder = new JudgePromptBuilder(
    fileSystem,
    config.judgePromptPath,
  );
  const judgeResultParser = new JudgeResultParser();
  const runPaths = new RunPaths(activeRun.ticketsPath);
  const runRepository = new RunRepository(runPaths, fileSystem, ticketPromptBuilder);
  const scoreAggregator = new ScoreAggregator();
  const markdownReportWriter = new MarkdownReportWriter(activeRun.finalReportPath, fileSystem);
  const csvReportWriter = new CsvReportWriter(activeRun.finalReportPath, fileSystem);
  const jsonReportWriter = new JsonReportWriter(activeRun.finalReportPath, fileSystem);
  const reportGenerator = new ReportGenerator(
    scoreAggregator,
    markdownReportWriter,
    csvReportWriter,
    jsonReportWriter,
  );
  const runService = new RunService(
    workspaceService,
    patchService,
    openCodeTaskRunner,
    judgePromptBuilder,
    judgeResultParser,
    runRepository,
    logger,
  );

  return {
    config,
    runName: activeRun.runName,
    runPath: activeRun.runPath,
    logger,
    ticketLoader,
    runRepository,
    runService,
    reportGenerator,
    workspaceService,
  };
}
