# Plan: Refine JSON output and add tests

1. **Refine JSON output**: Update `printIssueIdeas` in `src/cli.ts` to strictly map fields.
2. **Add smoke test**: Create `dist/tests/smoke.test.js` (or add to an existing test) to verify JSON output format.
3. **Re-align CLI check**: Change the `hasFlag` usage back to `process.argv.includes` or similar inline check if requested by judge feedback.
4. **Verify**: Run the project build and the new tests.
5. **Re-run judge**: Trigger the `FEAT-JSON-OUTPUT` ticket again.
