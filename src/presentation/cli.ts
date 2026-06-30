import { Command } from "commander";
import { createApp } from "../composition/createApp.js";

const program = new Command();

program
  .name("opencode-local-agent-eval")
  .description("Local Windows-only OpenCode agent evaluation harness")
  .version("0.1.0");

program
  .command("run-all")
  .description("Run evaluation for all tickets")
  .option("-r, --run-name <runName>", "run folder name; defaults to configuredRunName or a UUID")
  .action(async (options: { runName?: string }) => {
    const app = await createApp({ runName: options.runName });
    const tickets = await app.ticketLoader.loadAll();
    const scores = await app.runService.runAll(tickets);
    await app.reportGenerator.generate(scores, tickets);
    app.logger.info(`Done. Run ${app.runName} written to ${app.runPath}`);
  });

program
  .command("run")
  .description("Run evaluation for one ticket")
  .argument("<ticketId>")
  .option("-r, --run-name <runName>", "run folder name; defaults to configuredRunName or a UUID")
  .action(async (ticketId: string, options: { runName?: string }) => {
    const app = await createApp({ runName: options.runName });
    const ticket = await app.ticketLoader.loadById(ticketId);
    await app.runService.runTicket(ticket);
    app.logger.info(`Done. Run ${app.runName} written to ${app.runPath}`);
  });

program
  .command("report")
  .description("Regenerate final report from saved score files")
  .option("-r, --run-name <runName>", "existing run folder name; defaults to configuredRunName or the latest run")
  .action(async (options: { runName?: string }) => {
    const app = await createApp({ runName: options.runName, existingRun: true });
    const scores = await app.runRepository.readScores();
    const tickets = await app.ticketLoader.loadAll();
    await app.reportGenerator.generate(scores, tickets);
    app.logger.info(`Reports for ${app.runName} written to ${app.runPath}`);
  });

program
  .command("clean")
  .description("Delete workspace folders for a run")
  .option("-r, --run-name <runName>", "existing run folder name; defaults to configuredRunName or the latest run")
  .action(async (options: { runName?: string }) => {
    const app = await createApp({ runName: options.runName, existingRun: true });
    await app.workspaceService.cleanAll();
    app.logger.info(`Deleted workspaces for run ${app.runName}`);
  });

program
  .command("seed-random-scores")
  .description("Create random score files for local report smoke testing")
  .option("-c, --count <count>", "number of random scores", "5")
  .option("-r, --run-name <runName>", "run folder name; defaults to configuredRunName or a UUID")
  .action(async (options: { count: string; runName?: string }) => {
    const app = await createApp({ runName: options.runName });
    const count = Number.parseInt(options.count, 10);

    if (!Number.isInteger(count) || count <= 0) {
      throw new Error("count must be a positive integer");
    }

    await app.randomScoreSeeder.seed(count);
    const scores = await app.runRepository.readScores();
    const tickets = await app.ticketLoader.loadAll();
    await app.reportGenerator.generate(scores, tickets);
    app.logger.info(`Seeded ${count} random scores in run ${app.runName}.`);
  });

program.parseAsync().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
