export class JudgeWorkflow {
    openCodeTaskRunner;
    judgePromptBuilder;
    judgeResultParser;
    runRepository;
    constructor(openCodeTaskRunner, judgePromptBuilder, judgeResultParser, runRepository) {
        this.openCodeTaskRunner = openCodeTaskRunner;
        this.judgePromptBuilder = judgePromptBuilder;
        this.judgeResultParser = judgeResultParser;
        this.runRepository = runRepository;
    }
    async run(input) {
        const judgePrompt = await this.judgePromptBuilder.build({
            ticket: input.ticket,
            goldPatch: input.goldPatch,
            candidatePatch: input.candidatePatch,
        });
        await this.runRepository.writeJudgeInput(input.ticket.id, judgePrompt);
        const rawJudgeOutput = await input.tools.runOpenCodeWithLogCapture(input.ticket.id, () => this.openCodeTaskRunner.judge(judgePrompt, input.repoWorkingPath, {
            promptPath: input.runPaths.judgePromptPath,
            rawPath: input.runPaths.judgeRawLogPath,
            stdoutPath: input.runPaths.judgeStdoutLogPath,
            stderrPath: input.runPaths.judgeStderrLogPath,
            transcriptPath: input.runPaths.opencodeLogPath,
            phase: "judge",
            onConsoleOutput: (chunk) => input.tools.writeLiveOpenCodeOutput(chunk),
        }), "judge");
        await this.runRepository.writeJudgeOutput(input.ticket.id, rawJudgeOutput.stdout);
        await this.runRepository.writeJudgeLogs(input.ticket.id, rawJudgeOutput);
        let score;
        try {
            score = this.judgeResultParser.parse(input.ticket.id, rawJudgeOutput.stdout);
        }
        catch (error) {
            score = this.createFailedTicketScore(input.ticket.id, error, {
                failureType: rawJudgeOutput.stdout.trim() ? "judge_invalid_json" : "judge_no_json",
                fallbackSummary: rawJudgeOutput.stdout.trim()
                    ? "Judge returned output, but it was not valid score JSON."
                    : "Judge completed without returning score JSON on stdout.",
            });
            await this.runRepository.writeFailure(input.ticket.id, this.formatError(error));
            await this.runRepository.writeScore(input.ticket.id, score);
            input.tools.logStatus("error", "FAIL", `${input.ticket.id} judge output could not be parsed. Fallback score saved.`);
            return score;
        }
        await this.runRepository.writeScore(input.ticket.id, score);
        input.tools.logStatus("info", "SCORE", `${input.ticket.id} scored ${score.score} (${score.verdict})`);
        return score;
    }
    createFailedTicketScore(ticketId, error, options) {
        const message = this.compactErrorMessage(error);
        return {
            taskId: ticketId,
            score: 0,
            verdict: "fail",
            solve_probability: 0,
            gold_alignment: 0,
            repo_pattern_quality: 0,
            minimality: 0,
            risk: 100,
            would_i_merge: false,
            summary: `${options.fallbackSummary}: ${message}`,
            strengths: [],
            problems: [message],
            failureType: options.failureType,
            failurePhase: "judge",
            failureMessage: message,
        };
    }
    compactErrorMessage(error) {
        const raw = error instanceof Error ? error.message : String(error);
        return this.truncate(raw.trim() || "Unknown judge failure.", 500);
    }
    formatError(error) {
        if (error instanceof Error) {
            return `${error.name}: ${error.message}\n${error.stack ?? ""}`.trimEnd() + "\n";
        }
        return `${String(error)}\n`;
    }
    truncate(value, maxLength) {
        if (value.length <= maxLength) {
            return value;
        }
        return `${value.slice(0, maxLength - 3)}...`;
    }
}
