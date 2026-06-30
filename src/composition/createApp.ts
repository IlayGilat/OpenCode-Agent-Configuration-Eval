import type { EvalConfig } from "../interfaces/config/interfaces.js";
import { OpenCodeRunner } from "../services/execution/opencode/OpenCodeRunner.js";
import { OpenCodeTaskRunner } from "../services/execution/opencode/OpenCodeTaskRunner.js";
import { RunContext } from "../services/execution/RunContext.js";
import { RunPaths } from "../services/execution/RunPaths.js";
import { RunRepository } from "../services/execution/RunRepository.js";
import { RunService } from "../services/execution/RunService.js";
import { FileSystem } from "../services/platform/FileSystem.js";
import { ProcessRunner } from "../services/platform/ProcessRunner.js";
import { TicketLoader } from "../services/preparation/tickets/TicketLoader.js";
import { TicketPromptBuilder } from "../services/preparation/tickets/TicketPromptBuilder.js";
import { GitService } from "../services/preparation/workspace/GitService.js";
import { PatchService } from "../services/preparation/workspace/PatchService.js";
import { WorkspaceService } from "../services/preparation/workspace/WorkspaceService.js";
import { ReportGenerator } from "../services/results/ReportGenerator.js";
import { ScoreAggregator } from "../services/results/ScoreAggregator.js";
import { CsvReportWriter } from "../services/results/writers/CsvReportWriter.js";
import { JsonReportWriter } from "../services/results/writers/JsonReportWriter.js";
import { MarkdownReportWriter } from "../services/results/writers/MarkdownReportWriter.js";
import { JudgePromptBuilder } from "../services/review/JudgePromptBuilder.js";
import { JudgeResultParser } from "../services/review/JudgeResultParser.js";
import { ConfigLoader } from "../services/setup/ConfigLoader.js";

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
