# BenchmarkQueue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement `BenchmarkQueue` to manage and retrieve uncompleted tasks from a `PersistenceProvider`.

**Architecture:** `BenchmarkQueue` depends on a `PersistenceProvider` interface to load tasks and retrieve completed task IDs, filtering out the completed ones.

**Tech Stack:** Python 3, `typing`.

## Global Constraints

- Must implement `BenchmarkQueue` in `src/orchestration/queue.py`.
- Must depend on `PersistenceProvider` from `src/persistence/base.py`.
- Must include unit tests in `tests/orchestration/test_queue.py`.

---

### Task 1: Implement BenchmarkQueue and Tests

**Files:**
- Create: `src/orchestration/queue.py`
- Create: `tests/orchestration/test_queue.py`

**Interfaces:**
- Consumes: `src.persistence.base.PersistenceProvider`

- [ ] **Step 1: Write unit tests for BenchmarkQueue**

```python
import pytest
from typing import List, Dict, Any
from src.orchestration.queue import BenchmarkQueue
from src.persistence.base import PersistenceProvider

class MockPersistence(PersistenceProvider):
    def __init__(self, tasks, completed):
        self.tasks = tasks
        self.completed = completed
        
    def load_tasks(self) -> List[Dict[str, Any]]:
        return self.tasks
        
    def save_task_result(self, task_id: str, result: Dict[str, Any]) -> None:
        pass
        
    def get_completed_tasks(self) -> List[str]:
        return self.completed

def test_get_next_task():
    tasks = [{'task_id': '1'}, {'task_id': '2'}, {'task_id': '3'}]
    completed = ['1']
    provider = MockPersistence(tasks, completed)
    queue = BenchmarkQueue(provider)
    
    assert queue.get_next_task() == {'task_id': '2'}

def test_get_next_task_all_complete():
    tasks = [{'task_id': '1'}]
    completed = ['1']
    provider = MockPersistence(tasks, completed)
    queue = BenchmarkQueue(provider)
    
    assert queue.get_next_task() is None

def test_get_next_task_empty():
    provider = MockPersistence([], [])
    queue = BenchmarkQueue(provider)
    
    assert queue.get_next_task() is None
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/orchestration/test_queue.py`
Expected: FAIL (ImportError or AttributeError)

- [ ] **Step 3: Write implementation**

```python
# src/orchestration/queue.py
from typing import List, Dict, Any
from src.persistence.base import PersistenceProvider

class BenchmarkQueue:
    def __init__(self, provider: PersistenceProvider):
        self.provider = provider

    def get_next_task(self) -> Dict[str, Any] | None:
        tasks = self.provider.load_tasks()
        completed = self.provider.get_completed_tasks()
        for task in tasks:
            if task['task_id'] not in completed:
                return task
        return None
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/orchestration/test_queue.py`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/orchestration/queue.py tests/orchestration/test_queue.py
git commit -m "feat: implement BenchmarkQueue and tests"
```
