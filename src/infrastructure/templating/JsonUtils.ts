export class JsonUtils {
  extractJsonObject(raw: string): unknown {
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = fenced?.[1] ?? this.extractFirstBalancedObject(raw);

    if (!candidate) {
      throw new Error("Could not find a JSON object in judge output.");
    }

    return JSON.parse(candidate);
  }

  private extractFirstBalancedObject(raw: string): string | undefined {
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
      } else if (char === "}") {
        depth -= 1;
      }

      if (depth === 0) {
        return raw.slice(start, index + 1);
      }
    }

    return undefined;
  }
}
