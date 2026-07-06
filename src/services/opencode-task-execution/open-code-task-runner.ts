import type { OpenCodeLogPaths, OpenCodeRunResult } from "../../interfaces/opencode/interfaces.js";
import type { JiraTicket } from "../../interfaces/tickets/interfaces.js";
import { TicketPromptBuilder } from "../ticket-input/ticket-prompt-builder.js";
import { OpenCodeRunner } from "../../adapters/opencode/open-code-runner.js";

export class OpenCodeTaskRunner {
  constructor(
    private readonly ticketPromptBuilder: TicketPromptBuilder,
    private readonly openCodeRunner: OpenCodeRunner,
  ) {}

  async solve(ticket: JiraTicket, repoWorkingPath: string, logs?: OpenCodeLogPaths): Promise<OpenCodeRunResult> {
    return this.run(await this.ticketPromptBuilder.build(ticket), repoWorkingPath, logs);
  }

  async judge(prompt: string, repoWorkingPath: string, logs?: OpenCodeLogPaths): Promise<OpenCodeRunResult> {
    return this.run(prompt, repoWorkingPath, logs);
  }

  private run(prompt: string, repoWorkingPath: string, logs?: OpenCodeLogPaths): Promise<OpenCodeRunResult> {
    return this.openCodeRunner.run({
      cwd: repoWorkingPath,
      prompt,
      logs,
    });
  }
}
