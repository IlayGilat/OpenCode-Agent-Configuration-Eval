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

