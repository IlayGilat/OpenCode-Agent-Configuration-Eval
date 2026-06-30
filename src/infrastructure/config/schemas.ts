import { z } from "zod";

export const evalConfigSchema = z.object({
  repoPath: z.string().min(1),
  runsPath: z.string().min(1),
  configuredRunName: z.string().min(1).nullable().optional().default(null),
  gitCommand: z.string().min(1).optional().default("git"),
  opencodeCommand: z.string().min(1),
  model: z.string().min(1),
  timeoutMinutes: z.number().int().positive(),
  solverPromptPath: z.string().min(1),
  judgePromptPath: z.string().min(1),
});

export const jiraTicketSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  baseCommit: z.string().min(1),
  goldCommit: z.string().min(1),
});

export const ticketsSchema = z.array(jiraTicketSchema);

export const judgeResultSchema = z.object({
  taskId: z.string().min(1),
  score: z.number().min(0).max(100),
  verdict: z.enum(["fail", "weak", "partial", "good", "excellent"]),
  solve_probability: z.number().min(0).max(100),
  gold_alignment: z.number().min(0).max(100),
  repo_pattern_quality: z.number().min(0).max(100),
  minimality: z.number().min(0).max(100),
  risk: z.number().min(0).max(100),
  would_i_merge: z.boolean(),
  summary: z.string(),
  strengths: z.array(z.string()),
  problems: z.array(z.string()),
});
