import { renderTemplate } from "../ticket-input/renderTemplate.js";
export class JudgePromptBuilder {
    fileSystem;
    judgePromptPath;
    static maxGoldPatchCharacters = 60_000;
    static maxCandidatePatchCharacters = 90_000;
    constructor(fileSystem, judgePromptPath) {
        this.fileSystem = fileSystem;
        this.judgePromptPath = judgePromptPath;
    }
    async build(input) {
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
    preparePatch(patch, maxCharacters) {
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
    changedFiles(patch) {
        const files = new Set();
        const diffHeader = /^diff --git a\/(.+?) b\/(.+)$/gm;
        let match;
        while ((match = diffHeader.exec(patch))) {
            files.add(match[2]);
        }
        return [...files].sort();
    }
    changedFilesNote(files) {
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
