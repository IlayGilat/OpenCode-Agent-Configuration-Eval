import type { EvalConfig } from "../../../interfaces/config/interfaces.js";
import type { JiraTicket } from "../../../interfaces/tickets/interfaces.js";
import { GitService } from "./GitService.js";

export class WorkspaceService {
  constructor(
    private readonly config: EvalConfig,
    private readonly gitService: GitService,
  ) {}

  async prepare(ticket: JiraTicket): Promise<string> {
    await this.gitService.forceCheckout(this.config.repoPath, ticket.baseCommit);
    await this.gitService.clean(this.config.repoPath);
    return this.config.repoPath;
  }

  async cleanAll(): Promise<void> {
    await this.gitService.clean(this.config.repoPath);
  }
}
