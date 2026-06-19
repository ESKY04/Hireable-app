/**
 * POST /api/resumes/[id]/tailor
 * Rewrites resume bullets to match a job description.
 *
 * Router: force_claude=true — rewriting requires reasoning, not just extraction.
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

  const { jobDescription, jobTitle, company } = await req.json()
  if (!jobDescription) return NextResponse.json({ error: "jobDescription required" }, { status: 400 })

  const content = resume.content as Record<string, unknown>

  const task = `You are an expert resume writer. Tailor this resume to match the job description below.

RULES:
- Keep all facts true — do not invent experience or skills
- Rewrite bullet points to emphasize relevant achievements using keywords from the job description
- Prioritize skills and experience most relevant to the role
- Keep the same JSON structure, just update content where relevant
- Add or reorder skills to surface the most relevant ones first

JOB TITLE: ${jobTitle ?? "Not specified"}
COMPANY: ${company ?? "Not specified"}

JOB DESCRIPTION:
${jobDescription.slice(0, 3000)}

CURRENT RESUME (JSON):
${JSON.stringify(content, null, 2).slice(0, 3000)}

Return ONLY the updated resume as valid JSON with the same structure. No explanation.`

  // force_claude=true: reasoning task, local model not suitable
  const routed = await routeTask(task, true)

  if (!routed.success) {
    return NextResponse.json({ error: routed.error ?? "Tailor failed" }, { status: 500 })
  }

  let tailored: Record<string, unknown>
  try {
    const jsonMatch = routed.result.match(/\{[\s\S]*\}/)
    tailored = JSON.parse(jsonMatch ? jsonMatch[0] : routed.result)
  } catch {
    return NextResponse.json(
      { error: "Could not parse tailored resume", raw: routed.result },
      { status: 422 }
    )
  }

  // Save tailored version back to the resume
  const updated = await prisma.resume.update({
    where: { id: params.id },
    data: {
      content: tailored as Parameters<typeof prisma.resume.update>[0]["data"]["content"],
      tailoredFor: jobTitle ? `${jobTitle}${company ? ` at ${company}` : ""}` : company ?? "Job",
    },
  })

  return NextResponse.json({
    resume: updated,
    meta: { executed_on: routed.executed_on, quality_score: routed.quality_score },
  })
}
