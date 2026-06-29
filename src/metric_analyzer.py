class MetricAnalyzer:
    def analyze(self, results):
        """
        results: list of dicts with 'success' (bool) key
        """
        total = len(results)
        if total == 0:
            return {"success_rate": 0.0}
        
        successes = sum(1 for r in results if r.get('success', False))
        return {
            "total_tasks": total,
            "successful_tasks": successes,
            "success_rate": successes / total
        }

if __name__ == '__main__':
    # Simple test case
    analyzer = MetricAnalyzer()
    sample_results = [{"success": True}, {"success": False}]
    print(analyzer.analyze(sample_results))
