import type { JiraTicket } from "../../interfaces/tickets/interfaces.js";
import { FileSystem } from "../platform/FileSystem.js";
import { renderTemplate } from "../preparation/tickets/renderTemplate.js";

export type JudgePromptInput = {
  ticket: JiraTicket;
  goldPatch: string;
  candidatePatch: string;
};

export class JudgePromptBuilder {
  constructor(
    private readonly fileSystem: FileSystem,
    private readonly judgePromptPath: string,
  ) {}

  async build(input: JudgePromptInput): Promise<string> {
    const template = await this.fileSystem.readText(this.judgePromptPath);
    return renderTemplate(template, {
      ticketId: input.ticket.id,
      title: input.ticket.title,
      description: input.ticket.description,
      goldPatch: input.goldPatch,
      candidatePatch: input.candidatePatch,
    });
  }
}
