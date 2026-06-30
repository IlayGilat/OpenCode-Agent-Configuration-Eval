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

