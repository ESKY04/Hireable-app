"""
Auto-Offload Routing System: Claude Code aggressively delegates to local Qwen.

Philosophy: Try local FIRST. Only use Claude if local can't handle it.

Usage:
    from lib.auto_offload_router import setup_router

    router = setup_router()
    result = router.execute(task)  # Auto-handles all routing
"""

import requests
import json
from typing import Dict, Any, Optional
from datetime import datetime


class AutoOffloadRouter:
    """Aggressively offloads work to local Qwen, escalates only when needed"""

    def __init__(self):
        self.local_available = self._check_local()
        self.execution_log = []

        if self.local_available:
            print("[OK] Auto-offload mode: LOCAL PRIMARY")
        else:
            print("[--] Auto-offload mode: CLAUDE ONLY (local unavailable)")

    def _check_local(self) -> bool:
        """Health check for localhost:8000"""
        try:
            response = requests.get("http://localhost:8000/health", timeout=2)
            return response.status_code == 200
        except:
            return False

    def execute(self, task: str, force_claude: bool = False) -> Dict[str, Any]:
        """
        Execute task with aggressive offloading strategy.

        Strategy:
        1. If force_claude=True, use Claude directly
        2. If local not available, use Claude
        3. OTHERWISE: Try local first, escalate to Claude only if local fails
        """

        start_time = datetime.now()

        if force_claude:
            return self._execute_claude(task, escalated=False, start_time=start_time)

        if not self.local_available:
            return self._execute_claude(task, escalated=False, start_time=start_time)

        local_result = self._try_local(task, start_time)

        if local_result["success"] and local_result["quality_score"] >= 70:
            self.execution_log.append(local_result)
            return local_result

        if not local_result["success"]:
            print(f"[WARN] Local failed ({local_result['error']}), escalating to Claude...")
        else:
            print(f"[WARN] Local quality too low ({local_result['quality_score']}/100), escalating to Claude...")

        claude_result = self._execute_claude(task, escalated=True, start_time=start_time)
        self.execution_log.append(claude_result)

        return claude_result

    def _try_local(self, task: str, start_time) -> Dict[str, Any]:
        """Try to execute on local Qwen"""
        try:
            response = requests.post(
                "http://localhost:8000/v1/chat/completions",
                json={
                    "model": "qwen3:8b",
                    "messages": [{"role": "user", "content": task}],
                    "tool_choice": "required",
                    "temperature": 0.7
                },
                timeout=60
            )

            if response.status_code != 200:
                return {
                    "task": task,
                    "executed_on": "local",
                    "result": None,
                    "quality_score": 0,
                    "execution_time": (datetime.now() - start_time).total_seconds(),
                    "escalated": False,
                    "success": False,
                    "error": f"HTTP {response.status_code}"
                }

            data = response.json()
            message = data.get("choices", [{}])[0].get("message", {})
            output = message.get("content", "")

            quality_score = self._score_quality(output, task)

            return {
                "task": task,
                "executed_on": "local",
                "result": output,
                "quality_score": quality_score,
                "execution_time": (datetime.now() - start_time).total_seconds(),
                "escalated": False,
                "success": True,
                "tool_calls": len(message.get("tool_calls", []))
            }

        except requests.exceptions.Timeout:
            return {
                "task": task,
                "executed_on": "local",
                "result": None,
                "quality_score": 0,
                "execution_time": (datetime.now() - start_time).total_seconds(),
                "escalated": False,
                "success": False,
                "error": "Timeout"
            }

        except Exception as e:
            return {
                "task": task,
                "executed_on": "local",
                "result": None,
                "quality_score": 0,
                "execution_time": (datetime.now() - start_time).total_seconds(),
                "escalated": False,
                "success": False,
                "error": str(e)
            }

    def _execute_claude(
        self,
        task: str,
        escalated: bool,
        start_time
    ) -> Dict[str, Any]:
        """Execute on Claude API"""
        try:
            import anthropic

            client = anthropic.Anthropic()
            message = client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=1024,
                messages=[{"role": "user", "content": task}]
            )

            output = message.content[0].text
            quality_score = self._score_quality(output, task)

            return {
                "task": task,
                "executed_on": "claude",
                "result": output,
                "quality_score": quality_score,
                "execution_time": (datetime.now() - start_time).total_seconds(),
                "escalated": escalated,
                "success": True
            }

        except Exception as e:
            return {
                "task": task,
                "executed_on": "claude",
                "result": None,
                "quality_score": 0,
                "execution_time": (datetime.now() - start_time).total_seconds(),
                "escalated": escalated,
                "success": False,
                "error": str(e)
            }

    def _score_quality(self, output: str, task: str) -> int:
        """Quick quality heuristic (0-100)"""
        score = 100

        if not output or len(output.strip()) < 5:
            return 0

        if any(p in output for p in ["[", "TODO", "FIXME", "XXX"]):
            score -= 20

        if len(output) < 50:
            score -= 10

        task_words = set(task.lower().split())
        output_words = set(output.lower().split())
        overlap = len(task_words & output_words)
        if overlap < 3:
            score -= 15

        return max(0, score)

    def get_stats(self) -> Dict[str, Any]:
        """Get routing statistics"""
        if not self.execution_log:
            return {"executions": 0, "local_available": self.local_available}

        local_count = sum(1 for r in self.execution_log if r["executed_on"] == "local")
        claude_count = sum(1 for r in self.execution_log if r["executed_on"] == "claude")
        escalated_count = sum(1 for r in self.execution_log if r.get("escalated"))
        success_count = sum(1 for r in self.execution_log if r.get("success"))
        avg_quality = sum(r["quality_score"] for r in self.execution_log) / len(self.execution_log)
        avg_time = sum(r["execution_time"] for r in self.execution_log) / len(self.execution_log)

        return {
            "total_executions": len(self.execution_log),
            "local_executed": local_count,
            "claude_executed": claude_count,
            "escalations": escalated_count,
            "success_rate": f"{(success_count / len(self.execution_log) * 100):.1f}%",
            "avg_quality_score": f"{avg_quality:.1f}/100",
            "avg_execution_time": f"{avg_time:.2f}s",
            "local_available": self.local_available
        }


def setup_router() -> AutoOffloadRouter:
    """Initialize auto-offload router"""
    return AutoOffloadRouter()
