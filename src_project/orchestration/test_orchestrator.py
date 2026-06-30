import unittest
from unittest.mock import MagicMock
from src.orchestration.orchestrator import AgentOrchestrator

class TestAgentOrchestrator(unittest.TestCase):
    def test_run_next(self):
        mock_queue = MagicMock()
        mock_provider = MagicMock()
        mock_queue.get_next_task.return_value = {'task_id': 'task1'}
        
        orchestrator = AgentOrchestrator(mock_queue, mock_provider)
        
        import subprocess
        with unittest.mock.patch('subprocess.run') as mock_run:
            mock_run.return_value = MagicMock(returncode=0, stdout='success')
            orchestrator.run_next()
            
        mock_provider.save_task_result.assert_called_with('task1', {'success': True, 'output': 'success'})

if __name__ == '__main__':
    unittest.main()
