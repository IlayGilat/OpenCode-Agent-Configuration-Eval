# AgentOrchestrator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement `AgentOrchestrator` to orchestrate agent tasks by consuming `BenchmarkQueue` and `PersistenceProvider`.

**Architecture:** Create a new `AgentOrchestrator` class that orchestrates task processing: polling the queue for tasks, executing them in a fresh subprocess, and persisting the results.

**Tech Stack:** Python, `subprocess`, `json`.

## Global Constraints

- Must use `BenchmarkQueue` to fetch tasks.
- Must use `PersistenceProvider` to save task results.
- Must execute agent in a fresh subprocess.

---

### Task 1: Implement AgentOrchestrator

**Files:**
- Create: `src/orchestration/orchestrator.py`
- Test: `tests/test_orchestrator.py`

**Interfaces:**
- Consumes: `src.orchestration.queue.BenchmarkQueue`, `src.persistence.base.PersistenceProvider`

- [ ] **Step 1: Create `src/orchestration/orchestrator.py`**

```python
import subprocess
import json
from src.orchestration.queue import BenchmarkQueue
from src.persistence.base import PersistenceProvider

class AgentOrchestrator:
    def __init__(self, queue: BenchmarkQueue, provider: PersistenceProvider):
        self.queue = queue
        self.provider = provider

    def run_next(self):
        task = self.queue.get_next_task()
        if not task:
            print("All tasks completed.")
            return

        print(f"Running task: {task['task_id']}")
        
        # Invoke agent in a fresh subprocess
        # Assuming agent command structure for demonstration
        result = subprocess.run(['python', 'agent_runner.py', json.dumps(task)], capture_output=True, text=True)
        
        self.provider.save_task_result(task['task_id'], {'success': result.returncode == 0, 'output': result.stdout})
```

- [ ] **Step 2: Create a minimal test `tests/test_orchestrator.py`**

```python
import unittest
from unittest.mock import MagicMock
from src.orchestration.orchestrator import AgentOrchestrator

class TestAgentOrchestrator(unittest.TestCase):
    def test_run_next(self):
        mock_queue = MagicMock()
        mock_provider = MagicMock()
        mock_queue.get_next_task.return_value = {'task_id': 'task1'}
        
        orchestrator = AgentOrchestrator(mock_queue, mock_provider)
        
        # This will fail as agent_runner.py doesn't exist, but we can verify orchestrator logic
        # For this implementation, we will mock subprocess.run to avoid needing agent_runner.py
        import subprocess
        with unittest.mock.patch('subprocess.run') as mock_run:
            mock_run.return_value = MagicMock(returncode=0, stdout='success')
            orchestrator.run_next()
            
        mock_provider.save_task_result.assert_called_with('task1', {'success': True, 'output': 'success'})

if __name__ == '__main__':
    unittest.main()
```

- [ ] **Step 3: Run tests**

Run: `python -m unittest tests/test_orchestrator.py`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/orchestration/orchestrator.py tests/test_orchestrator.py
git commit -m "feat: implement AgentOrchestrator"
```
