import path from "node:path";
import { ticketsSchema } from "../../interfaces/tickets/schemas.js";
export class TicketLoader {
    fileSystem;
    ticketsPath;
    constructor(fileSystem, ticketsPath = "tickets.json") {
        this.fileSystem = fileSystem;
        this.ticketsPath = ticketsPath;
    }
    async loadAll() {
        const raw = await this.fileSystem.readJson(path.resolve(this.ticketsPath));
        return ticketsSchema.parse(raw);
    }
    async loadById(ticketId) {
        const tickets = await this.loadAll();
        const ticket = tickets.find((item) => item.id === ticketId);
        if (!ticket) {
            throw new Error(`Ticket not found: ${ticketId}`);
        }
        return ticket;
    }
}
