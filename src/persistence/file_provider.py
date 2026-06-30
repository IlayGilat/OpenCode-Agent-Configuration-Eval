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
