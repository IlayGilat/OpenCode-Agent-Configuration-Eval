export function normalizeJudgeResult(value: unknown): unknown {
  if (!isRecord(value)) {
    return value;
  }

  const normalized = { ...value };

  if (normalized.verdict === "pass") {
    normalized.verdict = verdictFromScore(normalized.score);
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

export function verdictFromScore(score: unknown): string {
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

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
