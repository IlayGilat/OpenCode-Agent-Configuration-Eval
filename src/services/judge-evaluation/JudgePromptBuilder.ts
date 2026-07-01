import type { JiraTicket } from "../../interfaces/tickets/interfaces.js";
import { FileSystem } from "../../adapters/filesystem/FileSystem.js";
import { renderTemplate } from "../ticket-input/renderTemplate.js";

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
    const goldPatch = this.preparePatch(input.goldPatch, JudgePromptBuilder.maxGoldPatchCharacters);
    const candidatePatch = this.preparePatch(input.candidatePatch, JudgePromptBuilder.maxCandidatePatchCharacters);

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

  private preparePatch(patch: string, maxCharacters: number): { body: string; note: string } {
    const changedFiles = this.changedFiles(patch);

    if (patch.length <= maxCharacters) {
      return {
        body: patch || "[empty patch]",
        note: `Full patch included. ${this.changedFilesNote(changedFiles)}`,
      };
    }

    const headLength = Math.floor(maxCharacters * 0.7);
    const tailLength = maxCharacters - headLength;
    const omittedCharacters = patch.length - maxCharacters;

    return {
      body: [
        patch.slice(0, headLength),
        "",
        `[Patch truncated for judge input. ${omittedCharacters} characters omitted from the middle.]`,
        "",
        patch.slice(-tailLength),
      ].join("\n"),
      note: [
        `Patch truncated from ${patch.length} to ${maxCharacters} characters.`,
        this.changedFilesNote(changedFiles),
        "Use the visible diff and changed-file list as the judging context; do not inspect repository files.",
      ].join(" "),
    };
  }

  private changedFiles(patch: string): string[] {
    const files = new Set<string>();
    const diffHeader = /^diff --git a\/(.+?) b\/(.+)$/gm;
    let match: RegExpExecArray | null;

    while ((match = diffHeader.exec(patch))) {
      files.add(match[2]);
    }

    return [...files].sort();
  }

  private changedFilesNote(files: string[]): string {
    if (!files.length) {
      return "Changed files: none detected.";
    }

    const visibleFiles = files.slice(0, 30);
    const suffix = files.length > visibleFiles.length
      ? `, and ${files.length - visibleFiles.length} more`
      : "";

    return `Changed files (${files.length}): ${visibleFiles.join(", ")}${suffix}.`;
  }
}
