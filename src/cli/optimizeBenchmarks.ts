import { createApp } from "../composition/createApp.js";
import { updateMeasurement } from "../utils/measurementSwapper.js";
import fs from "fs/promises";

const variants = [
  { name: "default", apply: async () => {} },
  { 
      name: "constraint-heavy", 
      apply: async () => {
          const content = await fs.readFile(".opencode/agents/build-constraint-heavy.md", "utf-8");
          await updateMeasurement(".opencode/agents/build.md", content);
      } 
  }
];

for (const variant of variants) {
  console.log(`--- Running variant: ${variant.name} ---`);
  await variant.apply();
  
  const app = await createApp({ runName: variant.name });
  const tickets = await app.ticketLoader.loadAll();
  const allResults = [];
  
  for (const ticket of tickets) {
      try {
          const score = await app.benchmarkRunWorkflow.run(ticket);
          allResults.push({ ticketId: ticket.id, score });
      } catch (e) {
          console.error(`Ticket ${ticket.id} failed, skipping.`);
      }
  }
  
  await fs.appendFile("benchmark-results.json", JSON.stringify({ variant: variant.name, results: allResults }) + "\n");
  console.log(`Variant ${variant.name} finished.`);
}
