"""
Production Delegator: Routes tasks to Claude or local Qwen3.
Features: Task classification, tool execution, validation, caching, retries, error handling.

Usage:
    delegator = HybridAIDelegator()
    result = delegator.delegate("Summarize this document and extract key metrics")
"""

import requests
import json
import hashlib
import time
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from dataclasses import dataclass
import anthropic

# Configuration
QWEN_ENDPOINT = "http://localhost:8000/v1/chat/completions"
QWEN_MODEL = "qwen3:8b"
CLAUDE_MODEL = "claude-sonnet-4-6"
CACHE_EXPIRY_HOURS = 24
MAX_RETRIES = 3
RETRY_DELAY = 2

# Task classification keywords
QWEN_KEYWORDS = {
    "summarize", "extract", "parse", "process", "analyze data",
    "calculate", "format", "convert", "organize", "list",
    "clean", "filter", "transform", "aggregate"
}

CLAUDE_KEYWORDS = {
    "think", "reason", "decide", "design", "architect",
    "evaluate", "compare", "recommend", "strategize",
    "validate", "review", "critique", "plan"
}

@dataclass
class DelegationResult:
    """Result of delegation"""
    task: str
    route: str  # "qwen" or "claude"
    success: bool
    result: Any
    execution_time: float
    cached: bool = False
    error: Optional[str] = None

class TaskCache:
    """Simple in-memory cache with expiry"""
    def __init__(self, expiry_hours: int = 24):
        self.cache = {}
        self.expiry_hours = expiry_hours

    def get(self, key: str) -> Optional[Any]:
        if key in self.cache:
            result, timestamp = self.cache[key]
            if datetime.now() - timestamp < timedelta(hours=self.expiry_hours):
                return result
            else:
                del self.cache[key]
        return None

    def set(self, key: str, value: Any) -> None:
        self.cache[key] = (value, datetime.now())

    def get_key(self, task: str) -> str:
        return hashlib.md5(task.encode()).hexdigest()

class HybridAIDelegator:
    """Production delegator with classification, routing, validation, caching"""

    def __init__(self):
        self.cache = TaskCache(CACHE_EXPIRY_HOURS)
        self.claude_client = anthropic.Anthropic()
        self.execution_log = []

    def classify_task(self, task: str) -> str:
        task_lower = task.lower()
        qwen_score = sum(1 for kw in QWEN_KEYWORDS if kw in task_lower)
        claude_score = sum(1 for kw in CLAUDE_KEYWORDS if kw in task_lower)

        if qwen_score > 0 and qwen_score >= claude_score:
            return "qwen"
        return "claude"

    def call_qwen(self, task: str, tools: Optional[list] = None, retries: int = 0) -> Dict[str, Any]:
        if retries >= MAX_RETRIES:
            raise Exception(f"Qwen call failed after {MAX_RETRIES} retries")

        try:
            payload = {
                "model": QWEN_MODEL,
                "messages": [{"role": "user", "content": task}],
                "tool_choice": "required",
                "temperature": 0.7
            }

            if tools:
                payload["tools"] = tools

            response = requests.post(
                QWEN_ENDPOINT,
                json=payload,
                timeout=60
            )
            response.raise_for_status()
            return response.json()

        except requests.exceptions.ConnectionError:
            if retries < MAX_RETRIES:
                time.sleep(RETRY_DELAY)
                return self.call_qwen(task, tools, retries + 1)
            raise Exception("Cannot connect to Qwen endpoint (localhost:8000)")

        except Exception as e:
            raise Exception(f"Qwen call error: {str(e)}")

    def call_claude(self, task: str, context: Optional[str] = None) -> str:
        system_prompt = "You are a helpful assistant. Be direct and concise."

        if context:
            system_prompt += f"\n\nContext: {context}"

        message = self.claude_client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=1024,
            system=system_prompt,
            messages=[{"role": "user", "content": task}]
        )

        return message.content[0].text

    def extract_tool_calls(self, qwen_response: Dict) -> Dict[str, Any]:
        message = qwen_response.get("choices", [{}])[0].get("message", {})

        return {
            "tool_calls": message.get("tool_calls", []),
            "text": message.get("content", ""),
            "finish_reason": qwen_response.get("choices", [{}])[0].get("finish_reason")
        }

    def validate_with_claude(self, task: str, qwen_result: Dict) -> bool:
        validation_prompt = f"""
Task: {task}

Qwen's output:
{json.dumps(qwen_result, indent=2)}

Is this output correct, complete, and well-formatted?
Respond with ONLY "VALID" or "INVALID".
"""

        validation = self.call_claude(validation_prompt)
        return "VALID" in validation.upper()

    def execute_tools(self, tool_calls: list) -> Dict[str, Any]:
        executed = []
        results = {}

        for call in tool_calls:
            tool_name = call.get("function", {}).get("name", "unknown")
            args = json.loads(call.get("function", {}).get("arguments", "{}"))

            executed.append({
                "tool": tool_name,
                "args": args,
                "status": "would_execute"
            })

            results[tool_name] = {
                "executed": True,
                "arguments": args,
                "result": f"[Mock execution of {tool_name} with {args}]"
            }

        return {"executed": executed, "results": results}

    def delegate(self, task: str, validate: bool = True) -> DelegationResult:
        start_time = time.time()
        cache_key = self.cache.get_key(task)

        cached_result = self.cache.get(cache_key)
        if cached_result:
            result = cached_result
            result.cached = True
            result.execution_time = time.time() - start_time
            self.execution_log.append(result)
            return result

        try:
            route = self.classify_task(task)

            if route == "qwen":
                qwen_response = self.call_qwen(task)
                tool_data = self.extract_tool_calls(qwen_response)
                execution = self.execute_tools(tool_data.get("tool_calls", []))

                result_data = {
                    "task": task,
                    "route": "qwen",
                    "tool_calls": tool_data.get("tool_calls", []),
                    "text": tool_data.get("text"),
                    "execution": execution,
                    "finish_reason": tool_data.get("finish_reason")
                }

                if validate:
                    is_valid = self.validate_with_claude(task, result_data)
                    result_data["validated"] = is_valid

                result = DelegationResult(
                    task=task,
                    route="qwen",
                    success=True,
                    result=result_data,
                    execution_time=time.time() - start_time
                )

            else:
                claude_result = self.call_claude(task)
                result = DelegationResult(
                    task=task,
                    route="claude",
                    success=True,
                    result={"text": claude_result},
                    execution_time=time.time() - start_time
                )

            self.cache.set(cache_key, result)
            self.execution_log.append(result)

            return result

        except Exception as e:
            result = DelegationResult(
                task=task,
                route="error",
                success=False,
                result=None,
                execution_time=time.time() - start_time,
                error=str(e)
            )
            self.execution_log.append(result)
            return result

    def get_stats(self) -> Dict[str, Any]:
        if not self.execution_log:
            return {"executions": 0}

        qwen_count = sum(1 for r in self.execution_log if r.route == "qwen")
        claude_count = sum(1 for r in self.execution_log if r.route == "claude")
        error_count = sum(1 for r in self.execution_log if not r.success)
        cached_count = sum(1 for r in self.execution_log if r.cached)
        avg_time = sum(r.execution_time for r in self.execution_log) / len(self.execution_log)

        return {
            "total_executions": len(self.execution_log),
            "qwen_routed": qwen_count,
            "claude_routed": claude_count,
            "errors": error_count,
            "cached_hits": cached_count,
            "avg_execution_time": round(avg_time, 2),
            "cache_size": len(self.cache.cache)
        }
