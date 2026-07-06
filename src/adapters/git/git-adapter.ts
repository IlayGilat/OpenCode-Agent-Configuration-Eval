import { ProcessRunner } from "../process/process-runner.js";

export class GitAdapter {
  constructor(
    private readonly processRunner: ProcessRunner,
    private readonly gitCommand = "git",
  ) {}

  async checkoutDetached(cwd: string, commit: string): Promise<void> {
    await this.processRunner.run(this.gitCommand, ["-C", cwd, "checkout", "--force", "--detach", commit]);
  }

  async cleanUntrackedFiles(cwd: string): Promise<void> {
    await this.processRunner.run(this.gitCommand, ["-C", cwd, "clean", "-fd"]);
  }

  async diffCommits(cwd: string, from: string, to: string): Promise<string> {
    const result = await this.processRunner.run(this.gitCommand, ["-C", cwd, "diff", "--binary", from, to]);
    return result.stdout;
  }

  async markUntrackedFilesForDiff(cwd: string): Promise<void> {
    await this.processRunner.run(this.gitCommand, ["-C", cwd, "add", "--intent-to-add", "--", "."]);
  }

  async diffWorkingTreeAgainstHead(cwd: string): Promise<string> {
    const args = ["-C", cwd, "diff", "--binary", "HEAD"];
    const result = await this.processRunner.run(this.gitCommand, args);
    return result.stdout;
  }
}
