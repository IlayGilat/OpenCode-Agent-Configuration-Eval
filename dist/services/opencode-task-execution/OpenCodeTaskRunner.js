export class OpenCodeTaskRunner {
    ticketPromptBuilder;
    openCodeRunner;
    constructor(ticketPromptBuilder, openCodeRunner) {
        this.ticketPromptBuilder = ticketPromptBuilder;
        this.openCodeRunner = openCodeRunner;
    }
    async solve(ticket, repoWorkingPath, logs) {
        return this.run(await this.ticketPromptBuilder.build(ticket), repoWorkingPath, logs);
    }
    async judge(prompt, repoWorkingPath, logs) {
        return this.run(prompt, repoWorkingPath, logs);
    }
    run(prompt, repoWorkingPath, logs) {
        return this.openCodeRunner.run({
            cwd: repoWorkingPath,
            prompt,
            logs,
        });
    }
}
