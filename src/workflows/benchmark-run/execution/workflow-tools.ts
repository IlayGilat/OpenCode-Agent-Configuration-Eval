import type { OpenCodeRunResult } from "../../../interfaces/opencode/interfaces.js";

export type Logger = Pick<typeof console, "info" | "warn" | "error">;
export type LogLevel = "info" | "warn" | "error";
export type Phase = "solver" | "judge";

export type OpenCodePhaseRunner = (
  ticketId: string,
  run: () => Promise<OpenCodeRunResult>,
  phase: Phase,
) => Promise<OpenCodeRunResult>;

export type WorkflowTools = {
  runOpenCodeWithLogCapture: OpenCodePhaseRunner;
  writeLiveOpenCodeOutput: (chunk: string) => void;
  logStatus: (level: LogLevel, label: string, message: string) => void;
};
