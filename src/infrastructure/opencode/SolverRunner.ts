import type { JiraTicket, OpenCodeLogPaths, OpenCodeRunResult } from "../../domain/domain.js";
import { TicketPromptBuilder } from "../../application/tickets/TicketPromptBuilder.js";
import { OpenCodeRunner } from "./OpenCodeRunner.js";

export class SolverRunner {
  constructor(
    private readonly ticketPromptBuilder: TicketPromptBuilder,
    private readonly openCodeRunner: OpenCodeRunner,
  ) {}

  async solve(ticket: JiraTicket, workspacePath: string, logs?: OpenCodeLogPaths): Promise<OpenCodeRunResult> {
    return this.openCodeRunner.run({
      cwd: workspacePath,
      prompt: await this.ticketPromptBuilder.build(ticket),
      logs,
    });
  }
}
