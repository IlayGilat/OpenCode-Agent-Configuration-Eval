import { createApp } from "../composition/createApp.js";
import { runCommand } from "./runCommand.js";

await runCommand(async () => {
  const [runName] = process.argv.slice(2);
  const app = await createApp({ runName });
  const tickets = await app.ticketLoader.loadAll();
  const scores = await app.runService.runAll(tickets);
  await app.reportGenerator.generate(scores, tickets);
  app.logger.info(`Done. Run ${app.runName} written to ${app.runPath}`);
});
