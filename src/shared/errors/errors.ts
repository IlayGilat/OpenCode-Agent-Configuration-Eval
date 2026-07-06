import { ProcessRunError } from "../../adapters/process/ProcessRunner.js";
import { truncateText } from "../text/truncateText.js";

export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}\n${error.stack ?? ""}`.trimEnd() + "\n";
  }

  return `${String(error)}\n`;
}

export function compactErrorMessage(
  error: unknown,
  fallback = "Unknown ticket execution failure.",
): string {
  const raw = error instanceof ProcessRunError
    ? firstErrorLine(error.result.stderr)
      ?? firstErrorLine(error.result.rawOutput)
      ?? firstMeaningfulLine(error.result.stderr)
      ?? firstMeaningfulLine(error.result.rawOutput)
      ?? firstMeaningfulLine(error.message)
    : error instanceof Error
      ? firstMeaningfulLine(error.message)
      : firstMeaningfulLine(String(error));

  return truncateText(raw ?? fallback, 500);
}

export function firstMeaningfulLine(value: string): string | undefined {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);
}

export function firstErrorLine(value: string): string | undefined {
  return value
    .split(/\r?\n/)
    .map((line) => line.replace(/\u001b\[[0-9;]*m/g, "").trim())
    .find((line) => /(^error:|error=|error\.error=|file not found|command line is too long|spawn enametoolong)/i.test(line));
}
