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
