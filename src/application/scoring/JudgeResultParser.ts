import type { JudgeResult } from "../../domain/domain.js";
import { judgeResultSchema } from "../../infrastructure/config/schemas.js";
import { JsonUtils } from "../../infrastructure/templating/JsonUtils.js";

export class JudgeResultParser {
  constructor(private readonly jsonUtils: JsonUtils) {}

  parse(taskId: string, raw: string): JudgeResult {
    const parsed = judgeResultSchema.parse(this.jsonUtils.extractJsonObject(raw));

    if (parsed.taskId !== taskId) {
      throw new Error(`Judge result taskId mismatch. Expected ${taskId}, received ${parsed.taskId}.`);
    }

    return parsed;
  }
}
