"""
Integrated Hybrid AI System: Delegator + Auto Work Checker + Auto-Offload Router
For use in Claude Code projects (Hireable, etc.)

Two routing strategies:
  - "classify"  (default): keyword-based, routes by task type before calling
  - "offload":  local-first, tries Qwen on every task, escalates on failure/low quality
"""

import requests
from typing import Optional, Dict, Any, Literal
from .hybrid_ai_delegator_production import HybridAIDelegator
from .auto_work_checker_skill import AutoWorkChecker
from .auto_offload_router import AutoOffloadRouter

RoutingStrategy = Literal["classify", "offload"]


class IntegratedHybridAI:
    """Combined delegator + validator for production work"""

    def __init__(self, check_local: bool = True, strategy: RoutingStrategy = "classify"):
        self.strategy = strategy
        self.checker = AutoWorkChecker()
        self.local_available = False

        if strategy == "offload":
            self.offload_router = AutoOffloadRouter()
            self.local_available = self.offload_router.local_available
            self.delegator = None
        else:
            self.delegator = HybridAIDelegator()
            self.offload_router = None
            if check_local:
                self.local_available = self._check_local_availability()
                if self.local_available:
                    print("[OK] Local Qwen system available")
                else:
                    print("[--] Local Qwen unavailable - using Claude only")

    def _check_local_availability(self) -> bool:
        try:
            response = requests.get("http://localhost:8000/health", timeout=2)
            return response.status_code == 200
        except:
            return False

    def work(
        self,
        task: str,
        output_type: str = "text",
        validate: bool = True,
        auto_correct: bool = True,
        force_claude: bool = False,
    ) -> Dict[str, Any]:
        """
        Execute work with automatic routing, execution, and validation.
        Set force_claude=True to bypass local routing entirely.
        """
        if self.strategy == "offload":
            raw = self.offload_router.execute(task, force_claude=force_claude)
            if not raw["success"]:
                return {
                    "task": task,
                    "routed_to": raw.get("executed_on", "error"),
                    "result": None,
                    "error": raw.get("error"),
                    "ready_to_use": False,
                }
            output = raw["result"]
            routed_to = raw["executed_on"]
        else:
            delegation_result = self.delegator.delegate(task, validate=False)
            if not delegation_result.success:
                return {
                    "task": task,
                    "routed_to": "error",
                    "result": None,
                    "error": delegation_result.error,
                    "ready_to_use": False,
                }
            routed_to = delegation_result.route
            if delegation_result.route == "qwen":
                output = delegation_result.result.get("text", "")
                if not output:
                    output = delegation_result.result.get("execution", {})
            else:
                output = delegation_result.result.get("text", "")

        validation_result = None
        quality_score = 100
        ready_to_use = True

        if validate and output:
            validation_result = self.checker.check(task, output, output_type)
            quality_score = max(0, 100 - (len(validation_result.issues_found) * 10))

            if auto_correct and validation_result.auto_corrected:
                output = validation_result.corrected_output

            ready_to_use = validation_result.approved or (
                validation_result.severity == "warning" and auto_correct
            )

        return {
            "task": task,
            "routed_to": routed_to,
            "result": output,
            "validated": validation_result is not None,
            "validation": {
                "approved": validation_result.approved if validation_result else None,
                "severity": validation_result.severity if validation_result else None,
                "issues": validation_result.issues_found if validation_result else [],
                "auto_corrected": validation_result.auto_corrected if validation_result else False
            } if validation_result else None,
            "quality_score": quality_score,
            "ready_to_use": ready_to_use,
            "execution_time": delegation_result.execution_time
        }

    def batch_work(
        self,
        tasks: list,
        output_type: str = "text",
        validate: bool = True,
        stop_on_error: bool = False
    ) -> list:
        results = []

        for i, task in enumerate(tasks, 1):
            print(f"\n[{i}/{len(tasks)}] Processing: {task[:50]}...")
            result = self.work(task, output_type, validate)
            results.append(result)

            if not result["ready_to_use"] and stop_on_error:
                print(f"Error: {result.get('error', 'Validation failed')}")
                break

            status = "[OK]" if result["ready_to_use"] else "[WARN]"
            print(f"{status} Quality: {result['quality_score']}/100")

        return results

    def get_stats(self) -> Dict[str, Any]:
        if self.strategy == "offload":
            router_stats = self.offload_router.get_stats()
            return {
                "strategy": "offload",
                "local_available": self.local_available,
                "router_stats": router_stats,
                "total_executions": router_stats.get("total_executions", 0),
            }
        return {
            "strategy": "classify",
            "local_available": self.local_available,
            "delegator_stats": self.delegator.get_stats(),
            "total_executions": len(self.delegator.execution_log),
        }


def setup_hybrid_ai(strategy: RoutingStrategy = "classify") -> IntegratedHybridAI:
    """
    Initialize hybrid AI system with auto-detection.

    strategy="classify"  - keyword-based routing (fast, predictable)
    strategy="offload"   - local-first with Claude fallback (maximizes local usage)
    """
    return IntegratedHybridAI(check_local=True, strategy=strategy)
