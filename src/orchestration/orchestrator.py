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
