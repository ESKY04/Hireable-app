"""
Auto Work Check Skill: Validates local model (Qwen) output quality.
Catches errors before they propagate, auto-corrects simple issues.
"""

import json
import re
from typing import Optional, Dict, Any
from dataclasses import dataclass
import anthropic

@dataclass
class ValidationResult:
    """Result of work validation"""
    approved: bool
    output_type: str
    original_output: Any
    corrected_output: Any
    issues_found: list
    severity: str
    auto_corrected: bool
    escalate_to_claude: bool
    feedback: str

class AutoWorkChecker:
    """Validates and corrects local model output"""

    def __init__(self):
        self.claude_client = anthropic.Anthropic()
        self.validation_log = []

    def check(self, task: str, output: Any, output_type: str) -> ValidationResult:
        if output_type == "json":
            return self._check_json(task, output)
        elif output_type == "code":
            return self._check_code(task, output)
        elif output_type == "structured":
            return self._check_structured(task, output)
        else:
            return self._check_text(task, output)

    def _check_json(self, task: str, output: str) -> ValidationResult:
        issues = []
        corrected = output
        auto_corrected = False

        try:
            parsed = json.loads(output)
        except json.JSONDecodeError as e:
            issues.append(f"Invalid JSON: {str(e)}")
            corrected = self._fix_json(output)
            try:
                json.loads(corrected)
                auto_corrected = True
                issues.append("Auto-corrected JSON syntax")
            except:
                return ValidationResult(
                    approved=False,
                    output_type="json",
                    original_output=output,
                    corrected_output=output,
                    issues_found=issues,
                    severity="critical",
                    auto_corrected=False,
                    escalate_to_claude=True,
                    feedback="JSON parsing failed; escalating to Claude"
                )

        severity = self._assess_severity(issues)
        approved = severity in ["none", "warning"]

        return ValidationResult(
            approved=approved,
            output_type="json",
            original_output=output,
            corrected_output=corrected,
            issues_found=issues,
            severity=severity,
            auto_corrected=auto_corrected,
            escalate_to_claude=severity == "critical",
            feedback=f"JSON validation: {len(issues)} issues found"
        )

    def _check_code(self, task: str, output: str) -> ValidationResult:
        issues = []
        corrected = output
        auto_corrected = False

        try:
            compile(output, '<string>', 'exec')
        except SyntaxError as e:
            issues.append(f"Syntax error: {str(e)}")
            corrected = self._fix_code_syntax(output)
            try:
                compile(corrected, '<string>', 'exec')
                auto_corrected = True
                issues.append("Auto-corrected syntax")
            except:
                pass

        code_issues = self._check_code_quality(output, task)
        issues.extend(code_issues)

        severity = self._assess_severity(issues)
        approved = severity in ["none", "warning"]

        return ValidationResult(
            approved=approved,
            output_type="code",
            original_output=output,
            corrected_output=corrected,
            issues_found=issues,
            severity=severity,
            auto_corrected=auto_corrected,
            escalate_to_claude=severity == "critical",
            feedback=f"Code validation: {len(issues)} issues found"
        )

    def _check_structured(self, task: str, output: Dict) -> ValidationResult:
        issues = []
        corrected = output
        auto_corrected = False

        if "must include" in task.lower():
            field_issues = self._check_required_fields(output, task)
            issues.extend(field_issues)

        null_issues = self._check_null_values(output, task)
        issues.extend(null_issues)

        type_issues = self._check_type_consistency(output)
        issues.extend(type_issues)

        severity = self._assess_severity(issues)
        approved = severity in ["none", "warning"]

        return ValidationResult(
            approved=approved,
            output_type="structured",
            original_output=output,
            corrected_output=corrected,
            issues_found=issues,
            severity=severity,
            auto_corrected=auto_corrected,
            escalate_to_claude=severity == "critical",
            feedback=f"Structured validation: {len(issues)} issues found"
        )

    def _check_text(self, task: str, output: str) -> ValidationResult:
        issues = []
        corrected = output
        auto_corrected = False

        if len(output.strip()) < 10:
            issues.append("Output too short (< 10 chars)")

        placeholders = re.findall(r'\[.*?\]|TODO|FIXME|XXX', output)
        if placeholders:
            issues.append(f"Found placeholders: {placeholders}")

        if output.count('\n') == 0 and len(output) > 500:
            issues.append("Long text without line breaks")

        severity = self._assess_severity(issues)
        approved = severity in ["none", "warning"]

        return ValidationResult(
            approved=approved,
            output_type="text",
            original_output=output,
            corrected_output=corrected,
            issues_found=issues,
            severity=severity,
            auto_corrected=auto_corrected,
            escalate_to_claude=severity in ["error", "critical"],
            feedback=f"Text validation: {len(issues)} issues found"
        )

    def _fix_json(self, json_str: str) -> str:
        fixed = json_str.replace("'", '"')
        fixed = re.sub(r'"\s*"', '", "', fixed)
        fixed = re.sub(r',(\s*[}\]])', r'\1', fixed)
        return fixed

    def _fix_code_syntax(self, code: str) -> str:
        return code

    def _check_code_quality(self, code: str, task: str) -> list:
        issues = []
        if "api" in task.lower() and "try:" not in code:
            issues.append("Missing error handling for API call")
        hardcoded = re.findall(r'(password|api[_-]?key|secret)', code, re.IGNORECASE)
        if hardcoded:
            issues.append(f"Potential hardcoded secrets: {hardcoded}")
        return issues

    def _check_required_fields(self, output: Dict, task: str) -> list:
        issues = []
        if "must include" in task.lower():
            parts = task.split("must include")
            if len(parts) > 1:
                required_text = parts[1]
                required = re.findall(r'["\']([^"\']+)["\']', required_text)
                for field in required:
                    if field not in str(output):
                        issues.append(f"Missing required field: {field}")
        return issues

    def _check_null_values(self, output: Dict, task: str) -> list:
        issues = []
        for key, value in output.items():
            if value is None or value == "" or value == []:
                if "optional" not in task.lower():
                    issues.append(f"Empty value for field: {key}")
        return issues

    def _check_type_consistency(self, output: Dict) -> list:
        issues = []
        for key, value in output.items():
            if isinstance(value, list) and len(value) > 1:
                types = set(type(v) for v in value)
                if len(types) > 1:
                    issues.append(f"Inconsistent types in {key}: {types}")
        return issues

    def _assess_severity(self, issues: list) -> str:
        if not issues:
            return "none"
        critical_keywords = ["critical", "invalid", "broken", "failed"]
        for issue in issues:
            if any(kw in issue.lower() for kw in critical_keywords):
                return "critical"
        if len(issues) >= 3:
            return "error"
        return "warning"
