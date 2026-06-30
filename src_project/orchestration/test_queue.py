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
