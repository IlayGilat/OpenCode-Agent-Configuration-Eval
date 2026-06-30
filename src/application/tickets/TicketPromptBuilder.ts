import type { JiraTicket } from "../../domain/domain.js";
import { FileSystem } from "../../infrastructure/filesystem/FileSystem.js";
import { TemplateRenderer } from "../../infrastructure/templating/TemplateRenderer.js";

export class TicketPromptBuilder {
  constructor(
    private readonly fileSystem: FileSystem,
    private readonly templateRenderer: TemplateRenderer,
    private readonly solverPromptPath: string,
  ) {}

  async build(ticket: JiraTicket): Promise<string> {
    const template = await this.fileSystem.readText(this.solverPromptPath);
    return this.templateRenderer.render(template, {
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
