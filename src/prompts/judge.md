You are judging an OpenCode solution against a historical merged PR.

Compare the candidate patch to the gold patch. The gold patch is a reference implementation, not a requirement for exact line-by-line matching.

Return only valid JSON with this shape:
{
  "taskId": "{{ticketId}}",
  "score": 0,
  "verdict": "fail",
  "solve_probability": 0,
  "gold_alignment": 0,
  "repo_pattern_quality": 0,
  "minimality": 0,
  "risk": 0,
  "would_i_merge": false,
  "summary": "",
  "strengths": [],
  "problems": []
}

Scoring guide:
- 90-100 excellent: clearly solves the issue and aligns well with the gold patch.
- 75-89 good: likely solves the issue with minor gaps or differences.
- 50-74 partial: meaningful progress but important uncertainty or omissions.
- 25-49 weak: small relevant progress but unlikely to be mergeable.
- 0-24 fail: wrong direction, no meaningful change, or high risk.

Ticket:
ID: {{ticketId}}
Title: {{title}}

Description:
{{description}}

Gold patch:
```diff
{{goldPatch}}
```

Candidate patch:
```diff
{{candidatePatch}}
```
