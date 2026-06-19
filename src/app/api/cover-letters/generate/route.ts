/**
 * POST /api/cover-letters/generate
 * Generates a cover letter from resume + job description.
 *
 * Router: force_claude=true — creative writing + reasoning task.
 */

import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { routeTask } from "@/lib/ai-router"

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { resumeId, jobTitle, company, jobDescription, tone } = await req.json()
  if (!jobTitle || !company || !jobDescription) {
    return NextResponse.json({ error: "jobTitle, company, jobDescription required" }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  let resumeContent = ""
  if (resumeId) {
    const resume = await prisma.resume.findFirst({ where: { id: resumeId, userId: user.id } })
    if (resume) resumeContent = JSON.stringify(resume.content, null, 2).slice(0, 2000)
  }

  const toneGuide =
    tone === "formal"
      ? "Use a formal, professional tone."
      : tone === "casual"
      ? "Use a warm, conversational tone while staying professional."
      : "Use a confident, direct tone — enthusiastic but not over the top."

  const task = `Write a compelling cover letter for this job application.

${toneGuide}

GUIDELINES:
- 3-4 paragraphs, under 400 words
- Opening: specific hook — why THIS role at THIS company
- Middle: 2-3 concrete achievements from the resume that map to the job requirements
- Closing: clear call to action
- Do NOT use generic phrases like "I am writing to apply" or "I would be a great fit"
- Do NOT repeat the resume verbatim — synthesize and tell a story

JOB TITLE: ${jobTitle}
COMPANY: ${company}

JOB DESCRIPTION:
${jobDescription.slice(0, 2000)}

${resumeContent ? `CANDIDATE RESUME:\n${resumeContent}` : ""}

Write the cover letter now (plain text, no subject line or date).`

  // force_claude=true: creative writing requires Claude
  const routed = await routeTask(task, true)

  if (!routed.success) {
    return NextResponse.json({ error: routed.error ?? "Generation failed" }, { status: 500 })
  }

  return NextResponse.json({
    content: routed.result,
    meta: { executed_on: routed.executed_on, quality_score: routed.quality_score },
  })
}
