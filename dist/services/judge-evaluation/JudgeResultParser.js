import { judgeResultSchema } from "../../interfaces/scoring/schemas.js";
import { jsonrepair } from "jsonrepair";
export class JudgeResultParser {
    parse(taskId, raw) {
        const parsed = judgeResultSchema.parse(this.normalize(this.extractJsonObject(raw)));
        if (parsed.taskId !== taskId) {
            throw new Error(`Judge result taskId mismatch. Expected ${taskId}, received ${parsed.taskId}.`);
        }
        return parsed;
    }
    normalize(value) {
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
    extractJsonObject(raw) {
        const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
        const candidate = fenced?.[1] ?? this.extractFirstBalancedObject(raw);
        if (!candidate) {
            throw new Error("Could not find a JSON object in judge output.");
        }
        return this.parseJson(candidate);
    }
    parseJson(candidate) {
        try {
            return JSON.parse(candidate);
        }
        catch {
            return JSON.parse(jsonrepair(candidate));
        }
    }
    extractFirstBalancedObject(raw) {
        const start = raw.indexOf("{");
        if (start === -1) {
            return undefined;
        }
        let depth = 0;
        let inString = false;
        let escaped = false;
        for (let index = start; index < raw.length; index += 1) {
            const char = raw[index];
            if (escaped) {
                escaped = false;
                continue;
            }
            if (char === "\\") {
                escaped = true;
                continue;
            }
            if (char === "\"") {
                inString = !inString;
                continue;
            }
            if (inString) {
                continue;
            }
            if (char === "{") {
                depth += 1;
            }
            else if (char === "}") {
                depth -= 1;
            }
            if (depth === 0) {
                return raw.slice(start, index + 1);
            }
        }
        return undefined;
    }
    verdictFromScore(score) {
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
    isRecord(value) {
        return typeof value === "object" && value !== null && !Array.isArray(value);
    }
}
