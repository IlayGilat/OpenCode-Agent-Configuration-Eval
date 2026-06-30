import type { EvalConfig, JiraTicket } from "../../domain/domain.js";
import { GitService } from "./GitService.js";

export class PatchService {
  constructor(
    private readonly config: EvalConfig,
    private readonly gitService: GitService,
  ) {}

  async createGoldPatch(ticket: JiraTicket): Promise<string> {
    return this.gitService.diff(this.config.repoPath, ticket.baseCommit, ticket.goldCommit);
  }

  async captureCandidatePatch(workspacePath: string): Promise<string> {
    return this.gitService.diff(workspacePath);
  }

  isEmptyPatch(patch: string): boolean {
    return patch.trim().length === 0;
  }
}
