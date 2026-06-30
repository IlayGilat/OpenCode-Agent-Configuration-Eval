import type { z } from "zod";
import type { evalConfigSchema } from "./schemas.js";

export type EvalConfig = z.infer<typeof evalConfigSchema>;
