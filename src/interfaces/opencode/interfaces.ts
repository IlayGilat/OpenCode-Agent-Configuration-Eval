import type { ProcessResult } from "../process/interfaces.js";

export type OpenCodeRunResult = ProcessResult & {
  combinedOutput: string;
};

export type OpenCodeLogPaths = {
  promptPath: string;
  rawPath: string;
  stdoutPath: string;
  stderrPath: string;
  transcriptPath: string;
  phase: "solver" | "judge";
  onConsoleOutput?: (chunk: string) => void;
};
