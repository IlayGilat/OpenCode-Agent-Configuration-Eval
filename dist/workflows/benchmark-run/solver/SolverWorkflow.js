import { createEmptyPatchScore } from "../../../services/judge-evaluation/createEmptyPatchScore.js";
export class SolverWorkflow {
    openCodeTaskRunner;
    patchComparisonService;
    runRepository;
    constructor(openCodeTaskRunner, patchComparisonService, runRepository) {
        this.openCodeTaskRunner = openCodeTaskRunner;
        this.patchComparisonService = patchComparisonService;
        this.runRepository = runRepository;
    }
    async run(ticket, repoWorkingPath, runPaths, tools) {
        const solverOutput = await tools.runOpenCodeWithLogCapture(ticket.id, () => this.openCodeTaskRunner.solve(ticket, repoWorkingPath, {
            promptPath: runPaths.solverPromptPath,
            rawPath: runPaths.solverRawLogPath,
            stdoutPath: runPaths.solverStdoutLogPath,
            stderrPath: runPaths.solverStderrLogPath,
            transcriptPath: runPaths.opencodeLogPath,
            phase: "solver",
            onConsoleOutput: (chunk) => tools.writeLiveOpenCodeOutput(chunk),
        }), "solver");
        await this.runRepository.writeSolverOutput(ticket.id, solverOutput.combinedOutput);
        await this.runRepository.writeSolverLogs(ticket.id, solverOutput);
        tools.logStatus("info", "PATCH", `${ticket.id} capturing candidate patch.`);
        const candidatePatch = await this.patchComparisonService.captureCandidatePatch(repoWorkingPath);
        await this.runRepository.writeCandidatePatch(ticket.id, candidatePatch);
        tools.logStatus("info", "PATCH", `${ticket.id} candidate patch saved.`);
        if (this.patchComparisonService.isEmptyPatch(candidatePatch)) {
            const emptyScore = createEmptyPatchScore(ticket.id);
            await this.runRepository.writeScore(ticket.id, emptyScore);
            tools.logStatus("warn", "WARN", `${ticket.id} produced no patch. Scored as fail.`);
            return { kind: "empty-patch", score: emptyScore };
        }
        return { kind: "candidate-patch", candidatePatch };
    }
}
