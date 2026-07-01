import path from "node:path";
import { judgeResultSchema } from "../../interfaces/scoring/schemas.js";
export class RunArtifactRepository {
    runPaths;
    fileSystem;
    ticketPromptBuilder;
    static savedOutputCharacterLimit = 20_000;
    constructor(runPaths, fileSystem, ticketPromptBuilder) {
        this.runPaths = runPaths;
        this.fileSystem = fileSystem;
        this.ticketPromptBuilder = ticketPromptBuilder;
    }
    async createRunFolder(ticketId) {
        await this.fileSystem.ensureDir(this.runPaths.forTicket(ticketId).runDir);
    }
    pathsForTicket(ticketId) {
        return this.runPaths.forTicket(ticketId);
    }
    async writeTicketMarkdown(ticket) {
        const paths = this.runPaths.forTicket(ticket.id);
        await this.fileSystem.writeText(paths.ticketMarkdownPath, this.ticketPromptBuilder.buildMarkdown(ticket));
    }
    async writeGoldPatch(ticketId, patch) {
        await this.fileSystem.writeText(this.runPaths.forTicket(ticketId).goldPatchPath, patch);
    }
    async writeCandidatePatch(ticketId, patch) {
        await this.fileSystem.writeText(this.runPaths.forTicket(ticketId).candidatePatchPath, patch);
    }
    async writeSolverOutput(ticketId, output) {
        await this.fileSystem.writeText(this.runPaths.forTicket(ticketId).solverOutputPath, this.compactSavedOutput(output));
    }
    async writeSolverLogs(ticketId, logs) {
        const paths = this.runPaths.forTicket(ticketId);
        await this.fileSystem.writeText(paths.solverRawLogPath, this.compactSavedOutput(logs.rawOutput));
        await this.fileSystem.writeText(paths.solverStdoutLogPath, this.compactSavedOutput(logs.stdout));
        await this.fileSystem.writeText(paths.solverStderrLogPath, this.compactSavedOutput(logs.stderr));
    }
    async writeJudgeInput(ticketId, input) {
        await this.fileSystem.writeText(this.runPaths.forTicket(ticketId).judgePromptPath, input);
    }
    async writeJudgeOutput(ticketId, output) {
        await this.fileSystem.writeText(this.runPaths.forTicket(ticketId).judgeOutputPath, this.compactSavedOutput(output));
    }
    async writeJudgeLogs(ticketId, logs) {
        const paths = this.runPaths.forTicket(ticketId);
        await this.fileSystem.writeText(paths.judgeRawLogPath, this.compactSavedOutput(logs.rawOutput));
        await this.fileSystem.writeText(paths.judgeStdoutLogPath, this.compactSavedOutput(logs.stdout));
        await this.fileSystem.writeText(paths.judgeStderrLogPath, this.compactSavedOutput(logs.stderr));
    }
    async writeScore(ticketId, score) {
        await this.fileSystem.writeJson(this.runPaths.forTicket(ticketId).scorePath, score);
    }
    async writeFailure(ticketId, failure) {
        await this.fileSystem.writeText(this.runPaths.forTicket(ticketId).failurePath, failure);
    }
    async readScores() {
        const runRoot = this.runPaths.root();
        const ticketDirs = await this.fileSystem.readDirectory(runRoot);
        const scores = [];
        for (const ticketDir of ticketDirs) {
            const scorePath = path.join(runRoot, ticketDir, "result", "score.json");
            const legacyScorePath = path.join(runRoot, ticketDir, "score.json");
            if (await this.fileSystem.exists(scorePath)) {
                scores.push(judgeResultSchema.parse(await this.fileSystem.readJson(scorePath)));
            }
            else if (await this.fileSystem.exists(legacyScorePath)) {
                scores.push(judgeResultSchema.parse(await this.fileSystem.readJson(legacyScorePath)));
            }
        }
        return scores.sort((left, right) => left.taskId.localeCompare(right.taskId));
    }
    compactSavedOutput(output) {
        if (output.length <= RunArtifactRepository.savedOutputCharacterLimit) {
            return output;
        }
        return [
            output.slice(0, RunArtifactRepository.savedOutputCharacterLimit),
            "",
            `[Output truncated at ${RunArtifactRepository.savedOutputCharacterLimit} characters. Full output was streamed to console during execution.]`,
            "",
        ].join("\n");
    }
}
