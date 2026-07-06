export function compactSavedOutput(output: string, characterLimit: number): string {
  if (output.length <= characterLimit) {
    return output;
  }

  return [
    output.slice(0, characterLimit),
    "",
    `[Output truncated at ${characterLimit} characters. Full output was streamed to console during execution.]`,
    "",
  ].join("\n");
}
