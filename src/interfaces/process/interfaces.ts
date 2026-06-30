export type ProcessOptions = {
  cwd?: string;
  timeoutMs?: number;
  onStdout?: (chunk: string) => void;
  onStderr?: (chunk: string) => void;
  onRawOutput?: (chunk: string) => void;
};

export type ProcessResult = {
  stdout: string;
  stderr: string;
  rawOutput: string;
};
