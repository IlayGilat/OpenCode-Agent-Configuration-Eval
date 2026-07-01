import { createApp } from "../composition/createApp.js";
import { runCommand } from "./runCommand.js";

await runCommand(async () => {
  const [ticketId, runName] = process.argv.slice(2);

  if (!ticketId) {
    throw new Error("Usage: npm run run:ticket -- <ticketId> [runName]");
  }

  const app = await createApp({ runName });
  const ticket = await app.ticketLoader.loadById(ticketId);
  await app.benchmarkRunWorkflow.runTicket(ticket);
  app.logger.info(`Done. Run ${app.runName} written to ${app.runPath}`);
});
