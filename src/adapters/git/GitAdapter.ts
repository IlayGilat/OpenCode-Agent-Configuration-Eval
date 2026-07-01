import { ProcessRunner } from "../process/ProcessRunner.js";

export class GitAdapter {
  constructor(
    private readonly processRunner: ProcessRunner,
    private readonly gitCommand = "git",
  ) {}

  async forceCheckout(cwd: string, commit: string): Promise<void> {
    await this.processRunner.run(this.gitCommand, ["-C", cwd, "checkout", "--force", "--detach", commit]);
  }

  async clean(cwd: string): Promise<void> {
    await this.processRunner.run(this.gitCommand, ["-C", cwd, "clean", "-fd"]);
  }

  async diff(cwd: string, from?: string, to?: string): Promise<string> {
    const args = ["-C", cwd, "diff"];

    if (from && to) {
      args.push(from, to);
    }

    const result = await this.processRunner.run(this.gitCommand, args);
    return result.stdout;
  }
}
