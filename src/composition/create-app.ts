import type { EvalConfig } from "../interfaces/config/interfaces.js";
import { OpenCodeRunner } from "../adapters/opencode/open-code-runner.js";
import { OpenCodeTaskRunner } from "../services/opencode-task-execution/open-code-task-runner.js";
import { RunContext } from "../workflows/pre-benchmark-run/run-context.js";
import { RunPaths } from "../workflows/pre-benchmark-run/run-paths.js";
import { RunArtifactRepository } from "../workflows/benchmark-run/artifacts/run-artifact-repository.js";
import { BenchmarkRunWorkflow } from "../workflows/benchmark-run/orchestration/benchmark-run-workflow.js";
import { JudgeWorkflow } from "../workflows/benchmark-run/judge/judge-workflow.js";
import { SolverWorkflow } from "../workflows/benchmark-run/solver/solver-workflow.js";
import { ReportWorkflow } from "../workflows/post-benchmark-run/report-workflow.js";
import { FileSystem } from "../adapters/filesystem/file-system.js";
import { ProcessRunner } from "../adapters/process/process-runner.js";
import { TicketLoader } from "../services/ticket-input/ticket-loader.js";
import { TicketPromptBuilder } from "../services/ticket-input/ticket-prompt-builder.js";
import { GitAdapter } from "../adapters/git/git-adapter.js";
import { PatchComparisonService } from "../services/patch-comparison/patch-comparison-service.js";
import { WorkspaceService } from "../services/workspace-preparation/workspace-service.js";
import { ReportGenerator } from "../services/result-reporting/generation/report-generator.js";
import { ScoreAggregator } from "../services/result-reporting/score-aggregator.js";
import { CsvReportWriter } from "../services/result-reporting/writers/csv-report-writer.js";
import { JsonReportWriter } from "../services/result-reporting/writers/json-report-writer.js";
import { MarkdownReportWriter } from "../services/result-reporting/writers/markdown-report-writer.js";
import { JudgePromptBuilder } from "../services/judge-evaluation/prompt/judge-prompt-builder.js";
import { JudgeResultParser } from "../services/judge-evaluation/parser/judge-result-parser.js";
import { ConfigLoader } from "../services/configuration-loading/loader/config-loader.js";

export type AppServices = {
  config: EvalConfig;
  runName: string;
  runPath: string;
  logger: Pick<typeof console, "info" | "warn" | "error">;
  ticketLoader: TicketLoader;
  runArtifactRepository: RunArtifactRepository;
  benchmarkRunWorkflow: BenchmarkRunWorkflow;
  reportWorkflow: ReportWorkflow;
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
  const gitAdapter = new GitAdapter(processRunner);
  const workspaceService = new WorkspaceService(config, gitAdapter);
  const patchComparisonService = new PatchComparisonService(config, gitAdapter);
  const openCodeRunner = new OpenCodeRunner(config, processRunner);
  const openCodeTaskRunner = new OpenCodeTaskRunner(ticketPromptBuilder, openCodeRunner);
  const judgePromptBuilder = new JudgePromptBuilder(
    fileSystem,
    config.judgePromptPath,
  );
  const judgeResultParser = new JudgeResultParser();
  const runPaths = new RunPaths(activeRun.ticketsPath);
  const runArtifactRepository = new RunArtifactRepository(runPaths, fileSystem, ticketPromptBuilder);
  const solverWorkflow = new SolverWorkflow(
    openCodeTaskRunner,
    patchComparisonService,
    runArtifactRepository,
  );
  const judgeWorkflow = new JudgeWorkflow(
    openCodeTaskRunner,
    judgePromptBuilder,
    judgeResultParser,
    runArtifactRepository,
  );
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
  const reportWorkflow = new ReportWorkflow(reportGenerator);
  const benchmarkRunWorkflow = new BenchmarkRunWorkflow(
    workspaceService,
    patchComparisonService,
    solverWorkflow,
    judgeWorkflow,
    runArtifactRepository,
    logger,
  );

  return {
    config,
    runName: activeRun.runName,
    runPath: activeRun.runPath,
    logger,
    ticketLoader,
    runArtifactRepository,
    benchmarkRunWorkflow,
    reportWorkflow,
    workspaceService,
  };
}
