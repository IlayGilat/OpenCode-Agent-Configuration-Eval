# Task-Queue Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a generic persistence layer and task queue manager to enable continuous, context-clearing benchmark execution.

**Architecture:** Decouples task loading, result storage, and agent execution. Uses an abstract `PersistenceProvider` for storage, and an `AgentOrchestrator` to manage the lifecycle of each agent process, ensuring fresh contexts.

**Tech Stack:** Python

## Global Constraints

- Must follow existing project structure.
- Persistence must be swappable without changing execution logic.
- Agent process must be spawned for each task to ensure fresh context.

---

### Task 1: Define Persistence Interface (`src/persistence/base.py`)

**Files:**
- Create: `src/persistence/base.py`

**Interfaces:**
- Produces: `PersistenceProvider` abstract base class with `load_tasks`, `save_task_result`, `get_completed_tasks`.

- [ ] **Step 1: Write interface definition**

```python
from abc import ABC, abstractmethod
from typing import List, Dict, Any

class PersistenceProvider(ABC):
    @abstractmethod
    def load_tasks(self) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    def save_task_result(self, task_id: str, result: Dict[str, Any]) -> None:
        pass

    @abstractmethod
    def get_completed_tasks(self) -> List[str]:
        pass
```

- [ ] **Step 2: Commit**

```bash
git add src/persistence/base.py
git commit -m "feat: define PersistenceProvider interface"
```

### Task 2: Implement File-based Persistence (`src/persistence/file_provider.py`)

**Files:**
- Create: `src/persistence/file_provider.py`
- Modify: `src/persistence/base.py`

**Interfaces:**
- Consumes: `PersistenceProvider` from `src/persistence/base.py`
- Produces: `FilePersistenceProvider` implementation.

- [ ] **Step 1: Implement `FilePersistenceProvider`**

```python
import json
import os
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

- [ ] **Step 2: Commit**

```bash
git add src/persistence/file_provider.py
git commit -m "feat: implement FilePersistenceProvider"
```

### Task 3: Implement Task Queue (`src/orchestration/queue.py`)

**Files:**
- Create: `src/orchestration/queue.py`

**Interfaces:**
- Consumes: `PersistenceProvider`

- [ ] **Step 1: Implement `BenchmarkQueue`**

```python
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

- [ ] **Step 2: Commit**

```bash
git add src/orchestration/queue.py
git commit -m "feat: implement BenchmarkQueue"
```

### Task 4: Implement Orchestrator (`src/orchestration/orchestrator.py`)

**Files:**
- Create: `src/orchestration/orchestrator.py`

**Interfaces:**
- Consumes: `BenchmarkQueue`, `PersistenceProvider`

- [ ] **Step 1: Implement `AgentOrchestrator`**

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

- [ ] **Step 2: Commit**

```bash
git add src/orchestration/orchestrator.py
git commit -m "feat: implement AgentOrchestrator"
```
