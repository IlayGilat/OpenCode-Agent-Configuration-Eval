import type { JudgeResult } from "../../domain/domain.js";
import { judgeResultSchema } from "../../infrastructure/config/schemas.js";
import { JsonUtils } from "../../infrastructure/templating/JsonUtils.js";

export class JudgeResultParser {
  constructor(private readonly jsonUtils: JsonUtils) {}

  parse(taskId: string, raw: string): JudgeResult {
    const parsed = judgeResultSchema.parse(this.normalize(this.jsonUtils.extractJsonObject(raw)));

    if (parsed.taskId !== taskId) {
      throw new Error(`Judge result taskId mismatch. Expected ${taskId}, received ${parsed.taskId}.`);
    }

    return parsed;
  }

  private normalize(value: unknown): unknown {
    if (!this.isRecord(value)) {
      return value;
    }

    const normalized = { ...value };

    if (normalized.verdict === "pass") {
      normalized.verdict = this.verdictFromScore(normalized.score);
    }

    for (const key of [
      "solve_probability",
      "gold_alignment",
      "repo_pattern_quality",
      "minimality",
      "risk",
    ]) {
      const metric = normalized[key];

      if (typeof metric === "number" && metric > 0 && metric <= 1) {
        normalized[key] = Math.round(metric * 100);
      }
    }

    return normalized;
  }

  private verdictFromScore(score: unknown): string {
    if (typeof score !== "number") {
      return "good";
    }

    if (score >= 90) {
      return "excellent";
    }

    if (score >= 75) {
      return "good";
    }

    if (score >= 50) {
      return "partial";
    }

    if (score >= 25) {
      return "weak";
    }

    return "fail";
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }
}
