import type { EvalConfig } from "../domain/domain.js";
import { ConfigLoader } from "../infrastructure/config/ConfigLoader.js";
import { FileSystem } from "../infrastructure/filesystem/FileSystem.js";
import { ProcessRunner } from "../infrastructure/process/ProcessRunner.js";
import { Logger } from "../infrastructure/logging/Logger.js";
import { JsonUtils } from "../infrastructure/templating/JsonUtils.js";
import { TemplateRenderer } from "../infrastructure/templating/TemplateRenderer.js";
import { TicketLoader } from "../application/tickets/TicketLoader.js";
import { TicketPromptBuilder } from "../application/tickets/TicketPromptBuilder.js";
import { WorkspaceService } from "../infrastructure/workspace/WorkspaceService.js";
import { GitService } from "../infrastructure/workspace/GitService.js";
import { PatchService } from "../infrastructure/workspace/PatchService.js";
import { OpenCodeRunner } from "../infrastructure/opencode/OpenCodeRunner.js";
import { SolverRunner } from "../infrastructure/opencode/SolverRunner.js";
import { JudgeRunner } from "../infrastructure/opencode/JudgeRunner.js";
import { JudgePromptBuilder } from "../application/scoring/JudgePromptBuilder.js";
import { JudgeResultParser } from "../application/scoring/JudgeResultParser.js";
import { ScoreAggregator } from "../application/scoring/ScoreAggregator.js";
import { RunPaths } from "../application/evaluation/RunPaths.js";
import { RunRepository } from "../application/evaluation/RunRepository.js";
import { RunService } from "../application/evaluation/RunService.js";
import { MarkdownReportWriter } from "../application/reports/MarkdownReportWriter.js";
import { CsvReportWriter } from "../application/reports/CsvReportWriter.js";
import { JsonReportWriter } from "../application/reports/JsonReportWriter.js";
import { ReportGenerator } from "../application/reports/ReportGenerator.js";
import { RandomScoreSeeder } from "../application/devtools/RandomScoreSeeder.js";
import { RunContext } from "../application/evaluation/RunContext.js";

export type AppServices = {
  config: EvalConfig;
  runName: string;
  runPath: string;
  logger: Logger;
  ticketLoader: TicketLoader;
  runRepository: RunRepository;
  runService: RunService;
  reportGenerator: ReportGenerator;
  workspaceService: WorkspaceService;
  randomScoreSeeder: RandomScoreSeeder;
};

export async function createApp(options: { runName?: string; existingRun?: boolean } = {}): Promise<AppServices> {
  const fileSystem = new FileSystem();
  const processRunner = new ProcessRunner();
  const logger = new Logger();
  const config = await new ConfigLoader(fileSystem).load();
  const runContext = new RunContext(config, fileSystem);
  const activeRun = options.existingRun
    ? await runContext.resolveExisting(options.runName)
    : runContext.createNew(options.runName);
  const templateRenderer = new TemplateRenderer();
  const ticketPromptBuilder = new TicketPromptBuilder(
    fileSystem,
    templateRenderer,
    config.solverPromptPath,
  );
  const ticketLoader = new TicketLoader(fileSystem);
  const gitService = new GitService(processRunner, config.gitCommand);
  const workspaceService = new WorkspaceService(config, activeRun.workspacesPath, fileSystem, gitService);
  const patchService = new PatchService(config, gitService);
  const openCodeRunner = new OpenCodeRunner(config, processRunner);
  const solverRunner = new SolverRunner(ticketPromptBuilder, openCodeRunner);
  const judgeRunner = new JudgeRunner(openCodeRunner);
  const judgePromptBuilder = new JudgePromptBuilder(
    fileSystem,
    templateRenderer,
    config.judgePromptPath,
  );
  const judgeResultParser = new JudgeResultParser(new JsonUtils());
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
    solverRunner,
    judgePromptBuilder,
    judgeRunner,
    judgeResultParser,
    runRepository,
    logger,
  );
  const randomScoreSeeder = new RandomScoreSeeder(runRepository);

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
    randomScoreSeeder,
  };
}
