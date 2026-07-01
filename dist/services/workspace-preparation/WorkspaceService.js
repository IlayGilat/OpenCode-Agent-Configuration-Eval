export class WorkspaceService {
    config;
    gitService;
    constructor(config, gitService) {
        this.config = config;
        this.gitService = gitService;
    }
    async prepare(ticket) {
        await this.gitService.forceCheckout(this.config.repoPath, ticket.baseCommit);
        await this.gitService.clean(this.config.repoPath);
        return this.config.repoPath;
    }
    async cleanAll() {
        await this.gitService.clean(this.config.repoPath);
    }
    async resetAfterTicket(ticket) {
        await this.gitService.forceCheckout(this.config.repoPath, ticket.baseCommit);
        await this.gitService.clean(this.config.repoPath);
    }
}
