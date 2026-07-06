import type { EvalConfig } from "../../interfaces/config/interfaces.js";
import type { JiraTicket } from "../../interfaces/tickets/interfaces.js";
import { GitAdapter } from "../../adapters/git/git-adapter.js";

export class WorkspaceService {
  constructor(
    private readonly config: EvalConfig,
    private readonly gitService: GitAdapter,
  ) {}

  async prepare(ticket: JiraTicket): Promise<string> {
    await this.gitService.checkoutDetached(this.config.repoPath, ticket.baseCommit);
    await this.gitService.cleanUntrackedFiles(this.config.repoPath);
    return this.config.repoPath;
  }

  async cleanAll(): Promise<void> {
    await this.gitService.cleanUntrackedFiles(this.config.repoPath);
  }

  async resetAfterTicket(ticket: JiraTicket): Promise<void> {
    await this.gitService.checkoutDetached(this.config.repoPath, ticket.baseCommit);
    await this.gitService.cleanUntrackedFiles(this.config.repoPath);
  }
}
