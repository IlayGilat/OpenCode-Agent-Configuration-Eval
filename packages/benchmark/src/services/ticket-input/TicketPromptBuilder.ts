import type { JiraTicket } from "../../interfaces/tickets/interfaces.js";
import { FileSystem } from "../../adapters/filesystem/FileSystem.js";
import { renderTemplate } from "./renderTemplate.js";

export class TicketPromptBuilder {
  constructor(
    private readonly fileSystem: FileSystem,
    private readonly solverPromptPath: string,
  ) {}

  async build(ticket: JiraTicket): Promise<string> {
    const template = await this.fileSystem.readText(this.solverPromptPath);
    return renderTemplate(template, {
      ticketId: ticket.id,
      title: ticket.title,
      description: ticket.description,
    });
  }

  buildMarkdown(ticket: JiraTicket): string {
    return `# ${ticket.id}: ${ticket.title}

${ticket.description}
`;
  }
}
