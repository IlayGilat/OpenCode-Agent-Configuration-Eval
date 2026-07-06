import type { JudgeResult } from "../../../interfaces/scoring/interfaces.js";
import { judgeResultSchema } from "../../../interfaces/scoring/schemas.js";
import { extractJsonObject } from "./jsonExtraction.js";
import { normalizeJudgeResult } from "./scoreNormalization.js";

export class JudgeResultParser {
  parse(taskId: string, raw: string): JudgeResult {
    const parsed = judgeResultSchema.parse(normalizeJudgeResult(extractJsonObject(raw)));

    if (parsed.taskId !== taskId) {
      throw new Error(`Judge result taskId mismatch. Expected ${taskId}, received ${parsed.taskId}.`);
    }

    return parsed;
  }
}
