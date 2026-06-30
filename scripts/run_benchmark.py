import sys
import os

# Add src to path so we can import our modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../src')))

from benchmark_runner import BenchmarkRunner
from metric_analyzer import MetricAnalyzer

def run_all():
    runner = BenchmarkRunner()
    tasks = runner.load_tasks()
    
    # Simulate execution results
    results = []
    for task in tasks:
        print(f"Running task {task['task_id']}...")
        # Simulate execution success for demo
        results.append({"task_id": task['task_id'], "success": True})
        
    analyzer = MetricAnalyzer()
    metrics = analyzer.analyze(results)
    
    print("\nBenchmark Results:")
    print(metrics)

if __name__ == '__main__':
    run_all()
