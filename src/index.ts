import { createApp } from "./composition/create-app.js";

try {
  const app = await createApp();
  const tickets = await app.ticketLoader.loadAll();
  const scores = await app.benchmarkRunWorkflow.runAll(tickets);
  await app.reportWorkflow.writeFinalReport(scores, tickets);
  app.logger.info(`Done. Run ${app.runName} written to ${app.runPath}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
