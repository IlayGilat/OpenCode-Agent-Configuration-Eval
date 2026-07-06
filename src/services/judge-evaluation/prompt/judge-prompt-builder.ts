import type { JiraTicket } from "../../../interfaces/tickets/interfaces.js";
import { FileSystem } from "../../../adapters/filesystem/file-system.js";
import { renderTemplate } from "../../ticket-input/render-template.js";
import { preparePatch } from "./patch-summary.js";

export type JudgePromptInput = {
  ticket: JiraTicket;
  goldPatch: string;
  candidatePatch: string;
};

export class JudgePromptBuilder {
  private static readonly maxGoldPatchCharacters = 60_000;
  private static readonly maxCandidatePatchCharacters = 90_000;

  constructor(
    private readonly fileSystem: FileSystem,
    private readonly judgePromptPath: string,
  ) {}

  async build(input: JudgePromptInput): Promise<string> {
    const template = await this.fileSystem.readText(this.judgePromptPath);
    const goldPatch = preparePatch(input.goldPatch, JudgePromptBuilder.maxGoldPatchCharacters);
    const candidatePatch = preparePatch(input.candidatePatch, JudgePromptBuilder.maxCandidatePatchCharacters);

    return renderTemplate(template, {
      ticketId: input.ticket.id,
      title: input.ticket.title,
      description: input.ticket.description,
      goldPatch: goldPatch.body,
      goldPatchNote: goldPatch.note,
      candidatePatch: candidatePatch.body,
      candidatePatchNote: candidatePatch.note,
    });
  }
}
