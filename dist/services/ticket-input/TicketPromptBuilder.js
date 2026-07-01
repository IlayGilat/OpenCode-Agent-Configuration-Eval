import { renderTemplate } from "./renderTemplate.js";
export class TicketPromptBuilder {
    fileSystem;
    solverPromptPath;
    constructor(fileSystem, solverPromptPath) {
        this.fileSystem = fileSystem;
        this.solverPromptPath = solverPromptPath;
    }
    async build(ticket) {
        const template = await this.fileSystem.readText(this.solverPromptPath);
        return renderTemplate(template, {
            ticketId: ticket.id,
            title: ticket.title,
            description: ticket.description,
        });
    }
    buildMarkdown(ticket) {
        return `# ${ticket.id}: ${ticket.title}

${ticket.description}
`;
    }
}
