export class PatchComparisonService {
    config;
    gitService;
    constructor(config, gitService) {
        this.config = config;
        this.gitService = gitService;
    }
    async createGoldPatch(ticket) {
        return this.gitService.diff(this.config.repoPath, ticket.baseCommit, ticket.goldCommit);
    }
    async captureCandidatePatch(repoWorkingPath) {
        return this.gitService.diff(repoWorkingPath);
    }
    isEmptyPatch(patch) {
        return patch.trim().length === 0;
    }
}
