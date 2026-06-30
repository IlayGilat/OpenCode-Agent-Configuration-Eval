import { z } from "zod";

export const evalConfigSchema = z.object({
  repoPath: z.string().min(1),
  runsPath: z.string().min(1),
  configuredRunName: z.string().min(1).nullable().optional().default(null),
  opencodeCommand: z.string().min(1),
  model: z.string().min(1),
  timeoutMinutes: z.number().int().positive(),
  solverPromptPath: z.string().min(1),
  judgePromptPath: z.string().min(1),
});
