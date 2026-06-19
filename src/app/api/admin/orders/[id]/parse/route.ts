import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"
import { routeTask } from "@/lib/ai-router"

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin()
  if (error) return error

  const order = await prisma.order.findUnique({ where: { id: params.id } })
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const task = `Extract and structure this resume as JSON with these fields:
{
  "name": "full name",
  "email": "email address",
  "phone": "phone number",
  "location": "city, state or country",
  "summary": "professional summary or objective (1-2 sentences)",
  "skills": ["skill1", "skill2", ...],
  "experience": [{"title": "job title", "company": "company name", "dates": "date range", "bullets": ["bullet 1", "bullet 2"]}],
  "education": [{"degree": "degree name", "school": "school name", "year": "graduation year"}],
  "certifications": ["cert1", "cert2"]
}

RESUME TEXT:
${order.currentResumeText.slice(0, 4000)}

Return ONLY valid JSON.`

  const routed = await routeTask(task, false)
  if (!routed.success) {
    return NextResponse.json({ error: routed.error ?? "Parse failed" }, { status: 500 })
  }

  let parsed: Record<string, unknown>
  try {
    const match = routed.result.match(/\{[\s\S]*\}/)
    parsed = JSON.parse(match ? match[0] : routed.result)
  } catch {
    return NextResponse.json({ error: "Could not parse response", raw: routed.result }, { status: 422 })
  }

  return NextResponse.json({ parsed, meta: { executed_on: routed.executed_on } })
}
