# Persistence Interface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Define the PersistenceProvider abstract base class.

**Architecture:** A standard ABC for swappable persistence layers.

**Tech Stack:** Python 3.10+ (using `abc`, `typing`)

## Global Constraints

- Must follow existing project structure.
- Persistence must be swappable without changing execution logic.
- Agent process must be spawned for each task to ensure fresh context.
- Interface: `PersistenceProvider` abstract base class with `load_tasks`, `save_task_result`, `get_completed_tasks`.

---

### Task 1: Define Persistence Interface

**Files:**
- Create: `src/persistence/base.py`
- Test: (None explicitly requested in brief, but good practice to verify imports)

**Interfaces:**
- Produces: `PersistenceProvider` abstract base class with `load_tasks`, `save_task_result`, `get_completed_tasks`.

- [ ] **Step 1: Create directory `src/persistence`**

```bash
mkdir src/persistence
```

- [ ] **Step 2: Create `src/persistence/base.py`**

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

- [ ] **Step 3: Verify content**

```bash
cat src/persistence/base.py
```

- [ ] **Step 4: Commit**

```bash
git add src/persistence/base.py
git commit -m "feat: define PersistenceProvider interface"
```
