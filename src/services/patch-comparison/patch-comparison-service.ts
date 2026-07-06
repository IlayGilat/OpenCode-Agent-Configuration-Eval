import type { EvalConfig } from "../../interfaces/config/interfaces.js";
import type { JiraTicket } from "../../interfaces/tickets/interfaces.js";
import { GitAdapter } from "../../adapters/git/git-adapter.js";

export class PatchComparisonService {
  constructor(
    private readonly config: EvalConfig,
    private readonly gitService: GitAdapter,
  ) {}

  async createGoldPatch(ticket: JiraTicket): Promise<string> {
    return this.gitService.diffCommits(this.config.repoPath, ticket.baseCommit, ticket.goldCommit);
  }

  async captureCandidatePatch(repoWorkingPath: string): Promise<string> {
    await this.gitService.markUntrackedFilesForDiff(repoWorkingPath);
    return this.gitService.diffWorkingTreeAgainstHead(repoWorkingPath);
  }

  isEmptyPatch(patch: string): boolean {
    return patch.trim().length === 0;
  }
}
