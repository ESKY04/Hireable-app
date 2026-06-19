import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"
import { routeTask } from "@/lib/ai-router"

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin()
  if (error) return error

  const order = await prisma.order.findUnique({ where: { id: params.id } })
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const task = `You are an expert resume writer. Rewrite this resume for the specific role below.

RULES:
- Keep all facts strictly true — do not invent experience, skills, or credentials
- Rewrite bullet points to emphasize achievements relevant to this role using strong action verbs
- Quantify achievements wherever the source material supports it
- Surface the most relevant skills and experience for this role
- Return clean, professional formatted text (NOT JSON) suitable for a PDF:
  * Name + contact info at top
  * Professional summary (2-3 sentences tailored to the role)
  * Experience section with clear bullets
  * Skills section
  * Education section
- Keep it under 700 words

TARGET ROLE: ${order.jobTitle} at ${order.company}
LOCATION: ${order.location}

JOB DESCRIPTION:
${order.jobDescription.slice(0, 2500)}

CANDIDATE'S CURRENT RESUME:
${order.currentResumeText.slice(0, 3000)}

Additional context: ${order.credentials ? order.credentials.slice(0, 500) : "None provided"}

Write the tailored resume now as clean professional text:`

  const routed = await routeTask(task, true)
  if (!routed.success) {
    return NextResponse.json({ error: routed.error ?? "Tailor failed" }, { status: 500 })
  }

  return NextResponse.json({ content: routed.result, meta: { executed_on: routed.executed_on } })
}
