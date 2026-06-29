# File-based Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement `FilePersistenceProvider` extending `PersistenceProvider` to enable file-based task storage.

**Architecture:** A file system-based provider that serializes/deserializes tasks and results using JSON.

**Tech Stack:** `json`, `os`, `typing` (built-in).

## Global Constraints

- Must implement `PersistenceProvider` interface from `src/persistence/base.py`.
- Must handle file system interactions (loading tasks from a file, saving results to a directory).

---

### Task 1: Scaffolding and Tests

**Files:**
- Create: `tests/persistence/test_file_provider.py`
- Modify: `src/persistence/__init__.py` (already done)

**Interfaces:**
- Consumes: `PersistenceProvider` from `src/persistence/base.py`

- [ ] **Step 1: Create test file**

```python
import os
import json
import pytest
from src.persistence.file_provider import FilePersistenceProvider

@pytest.fixture
def temp_dirs(tmp_path):
    results_dir = tmp_path / "results"
    task_file = tmp_path / "tasks.json"
    with open(task_file, 'w') as f:
        json.dump([{"id": "1", "data": "foo"}], f)
    return str(task_file), str(results_dir)

def test_load_tasks(temp_dirs):
    task_file, results_dir = temp_dirs
    provider = FilePersistenceProvider(task_file, results_dir)
    tasks = provider.load_tasks()
    assert tasks == [{"id": "1", "data": "foo"}]

def test_save_task_result(temp_dirs):
    task_file, results_dir = temp_dirs
    provider = FilePersistenceProvider(task_file, results_dir)
    provider.save_task_result("1", {"status": "done"})
    assert os.path.exists(os.path.join(results_dir, "1.json"))
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/persistence/test_file_provider.py`
Expected: FAIL with `ImportError` (provider not implemented)

### Task 2: Implement `FilePersistenceProvider`

**Files:**
- Create: `src/persistence/file_provider.py`
- Test: `tests/persistence/test_file_provider.py`

**Interfaces:**
- Produces: `FilePersistenceProvider` implementation.

- [ ] **Step 1: Implement `FilePersistenceProvider`**

```python
import json
import os
from typing import List, Dict, Any
from .base import PersistenceProvider

class FilePersistenceProvider(PersistenceProvider):
    def __init__(self, task_file: str, results_dir: str):
        self.task_file = task_file
        self.results_dir = results_dir
        os.makedirs(results_dir, exist_ok=True)

    def load_tasks(self) -> List[Dict[str, Any]]:
        with open(self.task_file, 'r') as f:
            return json.load(f)

    def save_task_result(self, task_id: str, result: Dict[str, Any]) -> None:
        with open(os.path.join(self.results_dir, f"{task_id}.json"), 'w') as f:
            json.dump(result, f)

    def get_completed_tasks(self) -> List[str]:
        return [f.replace('.json', '') for f in os.listdir(self.results_dir) if f.endswith('.json')]
```

- [ ] **Step 2: Run test to verify it passes**

Run: `pytest tests/persistence/test_file_provider.py`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/persistence/file_provider.py tests/persistence/test_file_provider.py
git commit -m "feat: implement FilePersistenceProvider and tests"
```
