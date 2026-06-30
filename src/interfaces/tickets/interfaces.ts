import type { z } from "zod";
import type { jiraTicketSchema } from "./schemas.js";

export type JiraTicket = z.infer<typeof jiraTicketSchema>;
