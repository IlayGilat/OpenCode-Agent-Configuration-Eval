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
