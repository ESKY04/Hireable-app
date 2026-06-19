/**
 * TypeScript client for the AutoOffloadRouter.
 * Calls the local Python bridge (port 8001) when available;
 * falls back to Anthropic directly using the same routing logic.
 *
 * Routing strategy mirrors auto_offload_router.py:
 *   - Try local FIRST for every task
 *   - Escalate to Claude on failure or quality < 70
 */

import Anthropic from "@anthropic-ai/sdk"

const BRIDGE_URL = "http://localhost:8001"
const CLAUDE_MODEL = "claude-sonnet-4-6"

export interface RouterResult {
  task: string
  executed_on: "local" | "claude"
  result: string
  quality_score: number
  execution_time: number
  escalated: boolean
  success: boolean
  error?: string
}

let bridgeAvailable: boolean | null = null

async function checkBridge(): Promise<boolean> {
  if (bridgeAvailable !== null) return bridgeAvailable
  try {
    const res = await fetch(`${BRIDGE_URL}/health`, {
      signal: AbortSignal.timeout(2000),
    })
    bridgeAvailable = res.ok
  } catch {
    bridgeAvailable = false
  }
  return bridgeAvailable
}

async function callBridge(task: string, force_claude = false): Promise<RouterResult> {
  const res = await fetch(`${BRIDGE_URL}/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task, force_claude }),
    signal: AbortSignal.timeout(60_000),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail ?? `Bridge error ${res.status}`)
  }
  return res.json()
}

async function callClaude(task: string, escalated: boolean): Promise<RouterResult> {
  const start = Date.now()
  const client = new Anthropic()
  const message = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    messages: [{ role: "user", content: task }],
  })
  const result = (message.content[0] as { text: string }).text
  return {
    task,
    executed_on: "claude",
    result,
    quality_score: scoreQuality(result, task),
    execution_time: (Date.now() - start) / 1000,
    escalated,
    success: true,
  }
}

function scoreQuality(output: string, task: string): number {
  let score = 100
  if (!output || output.trim().length < 5) return 0
  if (output.includes("TODO") || output.includes("FIXME")) score -= 20
  if (output.length < 50) score -= 10
  const taskWords = task.toLowerCase().split(/\s+/)
  const outWords = new Set(output.toLowerCase().split(/\s+/))
  const overlap = taskWords.filter((w) => outWords.has(w)).length
  if (overlap < 3) score -= 15
  return Math.max(0, score)
}

/**
 * Execute a task through the auto-offload router.
 * Set force_claude=true to skip local routing entirely.
 */
export async function routeTask(task: string, force_claude = false): Promise<RouterResult> {
  if (!force_claude && (await checkBridge())) {
    try {
      return await callBridge(task, force_claude)
    } catch {
      // bridge call failed — fall through to direct Claude
    }
  }
  return callClaude(task, false)
}
