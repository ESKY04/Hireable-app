/**
 * POST /api/resumes/[id]/score
 * Scores resume against a job description (0-100) with gap analysis.
 *
 * Router: force_claude=true — evaluation requires reasoning.
 */

import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { routeTask } from "@/lib/ai-router"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const resume = await prisma.resume.findFirst({ where: { id: params.id, userId: user.id } })
  if (!resume) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { jobDescription } = await req.json()
  if (!jobDescription) return NextResponse.json({ error: "jobDescription required" }, { status: 400 })

  const content = resume.content as Record<string, unknown>

  const task = `Evaluate this resume against the job description. Return a JSON object with:
{
  "score": <0-100 integer>,
  "strengths": [<up to 4 specific strengths matching the role>],
  "gaps": [<up to 4 specific missing skills or experience>],
  "keywords_matched": [<keywords from job description present in resume>],
  "keywords_missing": [<important keywords from job description absent from resume>],
  "recommendation": "<one sentence on the most impactful improvement>"
}

JOB DESCRIPTION:
${jobDescription.slice(0, 2000)}

RESUME:
${JSON.stringify(content, null, 2).slice(0, 2000)}

Return ONLY valid JSON.`

  const routed = await routeTask(task, true)

  if (!routed.success) {
    return NextResponse.json({ error: routed.error ?? "Score failed" }, { status: 500 })
  }

  let analysis: Record<string, unknown>
  try {
    const jsonMatch = routed.result.match(/\{[\s\S]*\}/)
    analysis = JSON.parse(jsonMatch ? jsonMatch[0] : routed.result)
  } catch {
    return NextResponse.json(
      { error: "Could not parse score response", raw: routed.result },
      { status: 422 }
    )
  }

  const score = typeof analysis.score === "number" ? Math.min(100, Math.max(0, analysis.score)) : null

  if (score !== null) {
    await prisma.resume.update({ where: { id: params.id }, data: { score } })
  }

  return NextResponse.json({ analysis, meta: { executed_on: routed.executed_on } })
}
