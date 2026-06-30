import { ProcessRunner } from "../process/ProcessRunner.js";

export class GitService {
  constructor(
    private readonly processRunner: ProcessRunner,
    private readonly gitCommand: string,
  ) {}

  async clone(sourcePath: string, destinationPath: string): Promise<void> {
    await this.processRunner.run(this.gitCommand, ["clone", sourcePath, destinationPath]);
  }

  async checkout(cwd: string, commit: string): Promise<void> {
    await this.processRunner.run(this.gitCommand, ["-C", cwd, "checkout", "--detach", commit]);
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
