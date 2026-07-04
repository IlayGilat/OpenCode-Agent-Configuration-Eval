import { z } from "zod";

export const jiraTicketSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  baseCommit: z.string().min(1),
  goldCommit: z.string().min(1),
});

export const ticketsSchema = z.array(jiraTicketSchema);
