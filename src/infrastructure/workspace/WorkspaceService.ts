import path from "node:path";
import type { EvalConfig, JiraTicket } from "../../domain/domain.js";
import { FileSystem } from "../filesystem/FileSystem.js";
import { GitService } from "./GitService.js";

export class WorkspaceService {
  constructor(
    private readonly config: EvalConfig,
    private readonly workspacesPath: string,
    private readonly fileSystem: FileSystem,
    private readonly gitService: GitService,
  ) {}

  async prepare(ticket: JiraTicket): Promise<string> {
    const workspacePath = this.workspacePath(ticket.id);
    await this.cleanup(ticket.id);
    await this.fileSystem.ensureDir(path.dirname(workspacePath));
    await this.gitService.clone(this.config.repoPath, workspacePath);
    await this.gitService.checkout(workspacePath, ticket.baseCommit);
    return workspacePath;
  }

  async cleanup(ticketId: string): Promise<void> {
    await this.fileSystem.removeDir(this.workspacePath(ticketId));
  }

  async cleanAll(): Promise<void> {
    const ticketDirs = await this.fileSystem.readDirectory(this.workspacesPath);

    for (const ticketDir of ticketDirs) {
      await this.cleanup(ticketDir);
    }
  }

  private workspacePath(ticketId: string): string {
    return path.join(this.workspacesPath, ticketId, "workspace");
  }
}
