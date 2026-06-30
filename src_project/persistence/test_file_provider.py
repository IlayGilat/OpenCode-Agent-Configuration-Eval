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
