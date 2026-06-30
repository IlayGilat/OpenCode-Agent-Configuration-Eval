import type { EvalConfig } from "../../interfaces/config/interfaces.js";
import type { JiraTicket } from "../../interfaces/tickets/interfaces.js";
import { GitService } from "./GitService.js";

export class PatchService {
  constructor(
    private readonly config: EvalConfig,
    private readonly gitService: GitService,
  ) {}

  async createGoldPatch(ticket: JiraTicket): Promise<string> {
    return this.gitService.diff(this.config.repoPath, ticket.baseCommit, ticket.goldCommit);
  }

  async captureCandidatePatch(repoWorkingPath: string): Promise<string> {
    return this.gitService.diff(repoWorkingPath);
  }

  isEmptyPatch(patch: string): boolean {
    return patch.trim().length === 0;
  }
}
