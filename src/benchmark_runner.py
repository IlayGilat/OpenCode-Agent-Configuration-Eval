import json
import os

class BenchmarkRunner:
    def __init__(self, task_file='data/benchmark_tasks/initial_tasks.json'):
        self.task_file = task_file

    def load_tasks(self):
        if not os.path.exists(self.task_file):
            raise FileNotFoundError(f"Task file not found: {self.task_file}")
        with open(self.task_file, 'r') as f:
            return json.load(f)

if __name__ == '__main__':
    runner = BenchmarkRunner()
    tasks = runner.load_tasks()
    print(f"Loaded {len(tasks)} tasks.")
