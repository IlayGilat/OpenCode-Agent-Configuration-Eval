import path from "node:path";
import type { JiraTicket } from "../../interfaces/tickets/interfaces.js";
import { ticketsSchema } from "../../interfaces/tickets/schemas.js";
import { FileSystem } from "../system/FileSystem.js";

export class TicketLoader {
  constructor(
    private readonly fileSystem: FileSystem,
    private readonly ticketsPath = "tickets.json",
  ) {}

  async loadAll(): Promise<JiraTicket[]> {
    const raw = await this.fileSystem.readJson(path.resolve(this.ticketsPath));
    return ticketsSchema.parse(raw);
  }

  async loadById(ticketId: string): Promise<JiraTicket> {
    const tickets = await this.loadAll();
    const ticket = tickets.find((item) => item.id === ticketId);

    if (!ticket) {
      throw new Error(`Ticket not found: ${ticketId}`);
    }

    return ticket;
  }
}
