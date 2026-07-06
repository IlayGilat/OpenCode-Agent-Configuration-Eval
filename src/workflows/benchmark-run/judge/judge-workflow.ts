import type { JudgeResult } from "../../../interfaces/scoring/interfaces.js";
import type { JiraTicket } from "../../../interfaces/tickets/interfaces.js";
import { createFailedScore } from "../../../shared/scoring/create-failed-score.js";
import { OpenCodeTaskRunner } from "../../../services/opencode-task-execution/open-code-task-runner.js";
import { JudgePromptBuilder } from "../../../services/judge-evaluation/prompt/judge-prompt-builder.js";
import { JudgeResultParser } from "../../../services/judge-evaluation/parser/judge-result-parser.js";
import { formatError } from "../../../shared/errors/errors.js";
import { RunArtifactRepository } from "../artifacts/run-artifact-repository.js";
import type { WorkflowTools } from "../execution/workflow-tools.js";

type JudgeRunPaths = ReturnType<RunArtifactRepository["pathsForTicket"]>;

export class JudgeWorkflow {
  constructor(
    private readonly openCodeTaskRunner: OpenCodeTaskRunner,
    private readonly judgePromptBuilder: JudgePromptBuilder,
    private readonly judgeResultParser: JudgeResultParser,
    private readonly runRepository: RunArtifactRepository,
  ) {}

  async run(input: {
    ticket: JiraTicket;
    repoWorkingPath: string;
    goldPatch: string;
    candidatePatch: string;
    runPaths: JudgeRunPaths;
    tools: WorkflowTools;
  }): Promise<JudgeResult> {
    const judgePrompt = await this.judgePromptBuilder.build({
      ticket: input.ticket,
      goldPatch: input.goldPatch,
      candidatePatch: input.candidatePatch,
    });

    await this.runRepository.writeJudgeInput(input.ticket.id, judgePrompt);

    const rawJudgeOutput = await input.tools.runOpenCodeWithLogCapture(
      input.ticket.id,
      () => this.openCodeTaskRunner.judge(judgePrompt, input.repoWorkingPath, {
        promptPath: input.runPaths.judgePromptPath,
        rawPath: input.runPaths.judgeRawLogPath,
        stdoutPath: input.runPaths.judgeStdoutLogPath,
        stderrPath: input.runPaths.judgeStderrLogPath,
        transcriptPath: input.runPaths.opencodeLogPath,
        phase: "judge",
        onConsoleOutput: (chunk) => input.tools.writeLiveOpenCodeOutput(chunk),
      }),
      "judge",
    );
    await this.runRepository.writeJudgeOutput(input.ticket.id, rawJudgeOutput.stdout);
    await this.runRepository.writeJudgeLogs(input.ticket.id, rawJudgeOutput);

    let score: JudgeResult;
    try {
      score = this.judgeResultParser.parse(input.ticket.id, rawJudgeOutput.stdout);
    } catch (error) {
      score = createFailedScore(input.ticket.id, error, {
        failureType: rawJudgeOutput.stdout.trim() ? "judge_invalid_json" : "judge_no_json",
        failurePhase: "judge",
        fallbackSummary: rawJudgeOutput.stdout.trim()
          ? "Judge returned output, but it was not valid score JSON."
          : "Judge completed without returning score JSON on stdout.",
        failureMessageFallback: "Unknown judge failure.",
      });
      await this.runRepository.writeFailure(input.ticket.id, formatError(error));
      await this.runRepository.writeScore(input.ticket.id, score);
      input.tools.logStatus("error", "FAIL", `${input.ticket.id} judge output could not be parsed. Fallback score saved.`);
      return score;
    }

    await this.runRepository.writeScore(input.ticket.id, score);
    input.tools.logStatus("info", "SCORE", `${input.ticket.id} scored ${score.score} (${score.verdict})`);

    return score;
  }
}
