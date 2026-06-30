import subprocess
import sys
import os

cmd = [sys.executable, '-c', 'import os; print(os.getpid())']

print(f'Orchestrator PID: {os.getpid()}')
subprocess.run(cmd)
subprocess.run(cmd)
