import { createApp } from "../composition/createApp.js";

const variants = [
  { name: "default", apply: async () => {} },
  { name: "aggressive", apply: async () => { 
      // Implementation placeholder for measurement swapping logic
      console.log("Applying aggressive measurement variant...");
  } }
];

for (const variant of variants) {
  console.log(`--- Running variant: ${variant.name} ---`);
  await variant.apply();
  
  const app = await createApp({ runName: variant.name });
  const tickets = await app.ticketLoader.loadAll();
  const scores = await app.benchmarkRunWorkflow.runAll(tickets);
  
  console.log(`Variant ${variant.name} finished. Scores:`, scores);
}
