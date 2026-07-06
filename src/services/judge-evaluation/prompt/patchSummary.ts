export function preparePatch(patch: string, maxCharacters: number): { body: string; note: string } {
  const files = changedFiles(patch);

  if (patch.length <= maxCharacters) {
    return {
      body: patch || "[empty patch]",
      note: `Full patch included. ${changedFilesNote(files)}`,
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
      changedFilesNote(files),
      "Use the visible diff and changed-file list as the judging context; do not inspect repository files.",
    ].join(" "),
  };
}

export function changedFiles(patch: string): string[] {
  const files = new Set<string>();
  const diffHeader = /^diff --git a\/(.+?) b\/(.+)$/gm;
  let match: RegExpExecArray | null;

  while ((match = diffHeader.exec(patch))) {
    files.add(match[2]);
  }

  return [...files].sort();
}

export function changedFilesNote(files: string[]): string {
  if (!files.length) {
    return "Changed files: none detected.";
  }

  const visibleFiles = files.slice(0, 30);
  const suffix = files.length > visibleFiles.length
    ? `, and ${files.length - visibleFiles.length} more`
    : "";

  return `Changed files (${files.length}): ${visibleFiles.join(", ")}${suffix}.`;
}
