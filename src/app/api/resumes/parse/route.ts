/**
 * POST /api/resumes/parse
 * Extracts structured data from raw resume text.
 *
 * Router classification: "extract" keyword → local Qwen first, Claude fallback.
 */

import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { routeTask } from "@/lib/ai-router"

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { text } = await req.json()
  if (!text) return NextResponse.json({ error: "text required" }, { status: 400 })

  // "extract" → router sends to local Qwen first, escalates to Claude if needed
  const task = `Extract and structure this resume as JSON with fields:
name, email, phone, location, summary, skills (array), experience (array of {title, company, dates, bullets}), education (array of {degree, school, year}).

Resume text:
${text.slice(0, 4000)}

Return ONLY valid JSON, no explanation.`

  const routed = await routeTask(task)

  if (!routed.success) {
    return NextResponse.json({ error: routed.error ?? "Parse failed" }, { status: 500 })
  }

  let parsed: Record<string, unknown>
  try {
    const jsonMatch = routed.result.match(/\{[\s\S]*\}/)
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : routed.result)
  } catch {
    return NextResponse.json(
      { error: "Could not parse AI response as JSON", raw: routed.result },
      { status: 422 }
    )
  }

  return NextResponse.json({
    parsed,
    meta: {
      executed_on: routed.executed_on,
      quality_score: routed.quality_score,
      escalated: routed.escalated,
    },
  })
}
