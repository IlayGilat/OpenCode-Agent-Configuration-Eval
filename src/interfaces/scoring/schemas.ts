import { z } from "zod";

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
  failureType: z.string().optional(),
  failurePhase: z.enum(["setup", "solver", "patch", "judge", "report"]).optional(),
  failureMessage: z.string().optional(),
});
