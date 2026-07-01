# Plan: Improve FEAT-JSON-OUTPUT implementation

1. **Read existing files**: Read `src/cli.ts` and `docs/CLI.md` to see the current state.
2. **Add tests**: Create a test file `tests/issueIdeas.test.ts` (if the project has a test structure) or add a test script to `package.json` to verify JSON output.
3. **Refine JSON output**: Update `printIssueIdeas` in `src/cli.ts` to map the `issueIdeas` array to a specific JSON schema with `title`, `label`, `difficulty`, `goal`, and `acceptanceCriteria` fields.
4. **Update help text**: Add the specific `--json` usage line to the help menu.
5. **Verify**: Run the project build and the new tests.
6. **Re-run judge**: Trigger the `FEAT-JSON-OUTPUT` ticket again to see if the score improves.
