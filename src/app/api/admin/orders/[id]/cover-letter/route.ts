import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"
import { routeTask } from "@/lib/ai-router"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin()
  if (error) return error

  const { tone = "confident" } = await req.json().catch(() => ({})) as { tone?: string }

  const order = await prisma.order.findUnique({ where: { id: params.id } })
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })

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
- Middle: 2-3 concrete achievements from the resume that map directly to job requirements
- Closing: clear call to action
- Do NOT use generic openers like "I am writing to apply" or "I would be a great fit"
- Do NOT repeat the resume verbatim — synthesize and tell a story
- Write as the candidate in first person

TARGET ROLE: ${order.jobTitle} at ${order.company}
LOCATION: ${order.location}

JOB DESCRIPTION:
${order.jobDescription.slice(0, 2000)}

CANDIDATE RESUME:
${order.currentResumeText.slice(0, 2000)}

Additional background: ${order.credentials ? order.credentials.slice(0, 400) : "None"}

Write the cover letter now (plain text, no date or subject line):`

  const routed = await routeTask(task, true)
  if (!routed.success) {
    return NextResponse.json({ error: routed.error ?? "Generation failed" }, { status: 500 })
  }

  return NextResponse.json({ content: routed.result, meta: { executed_on: routed.executed_on } })
}
