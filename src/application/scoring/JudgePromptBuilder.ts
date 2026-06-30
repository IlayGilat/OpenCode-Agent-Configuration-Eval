import type { JiraTicket } from "../../domain/domain.js";
import { FileSystem } from "../../infrastructure/filesystem/FileSystem.js";
import { TemplateRenderer } from "../../infrastructure/templating/TemplateRenderer.js";

export type JudgePromptInput = {
  ticket: JiraTicket;
  goldPatch: string;
  candidatePatch: string;
};

export class JudgePromptBuilder {
  constructor(
    private readonly fileSystem: FileSystem,
    private readonly templateRenderer: TemplateRenderer,
    private readonly judgePromptPath: string,
  ) {}

  async build(input: JudgePromptInput): Promise<string> {
    const template = await this.fileSystem.readText(this.judgePromptPath);
    return this.templateRenderer.render(template, {
      ticketId: input.ticket.id,
      title: input.ticket.title,
      description: input.ticket.description,
      goldPatch: input.goldPatch,
      candidatePatch: input.candidatePatch,
    });
  }
}
