export class GitAdapter {
    processRunner;
    gitCommand;
    constructor(processRunner, gitCommand = "git") {
        this.processRunner = processRunner;
        this.gitCommand = gitCommand;
    }
    async forceCheckout(cwd, commit) {
        await this.processRunner.run(this.gitCommand, ["-C", cwd, "checkout", "--force", "--detach", commit]);
    }
    async clean(cwd) {
        await this.processRunner.run(this.gitCommand, ["-C", cwd, "clean", "-fd"]);
    }
    async diff(cwd, from, to) {
        const args = ["-C", cwd, "diff"];
        if (from && to) {
            args.push(from, to);
        }
        const result = await this.processRunner.run(this.gitCommand, args);
        return result.stdout;
    }
}
