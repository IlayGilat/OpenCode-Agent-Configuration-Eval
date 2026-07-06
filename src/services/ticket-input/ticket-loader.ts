import path from "node:path";
import type { JiraTicket } from "../../interfaces/tickets/interfaces.js";
import { ticketsSchema } from "../../interfaces/tickets/schemas.js";
import { FileSystem } from "../../adapters/filesystem/file-system.js";

export class TicketLoader {
  constructor(
    private readonly fileSystem: FileSystem,
    private readonly ticketsPath = "tickets.json",
  ) {}

  async loadAll(): Promise<JiraTicket[]> {
    const raw = await this.fileSystem.readJson(path.resolve(this.ticketsPath));
    return ticketsSchema.parse(raw);
  }
}
