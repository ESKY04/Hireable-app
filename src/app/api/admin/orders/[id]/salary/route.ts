// TODO: Replace this Claude salary estimate with a real salary data API
// (e.g. Levels.fyi, LinkedIn Salary Insights, BLS OES) when available.

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"
import { routeTask } from "@/lib/ai-router"

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin()
  if (error) return error

  const order = await prisma.order.findUnique({ where: { id: params.id } })
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const task = `You are a compensation research expert. Estimate the realistic salary range for this role.

ROLE: ${order.jobTitle}
LOCATION: ${order.location}
EXPERIENCE LEVEL: ${order.experienceLevel}
CANDIDATE BACKGROUND: ${(order.credentials || order.currentResumeText).slice(0, 600)}

Respond ONLY with valid JSON:
{
  "low": <annual salary low end as integer USD, e.g. 85000>,
  "mid": <annual salary midpoint as integer USD>,
  "high": <annual salary high end as integer USD>,
  "rationale": "<2-3 sentences explaining the range based on role, location, and experience level>",
  "disclaimer": "Estimated range based on market research. Not a guarantee of actual compensation — verify with current market data and negotiate based on your specific situation."
}`

  const routed = await routeTask(task, true)
  if (!routed.success) {
    return NextResponse.json({ error: routed.error ?? "Salary estimate failed" }, { status: 500 })
  }

  let report: Record<string, unknown>
  try {
    const match = routed.result.match(/\{[\s\S]*\}/)
    report = JSON.parse(match ? match[0] : routed.result)
  } catch {
    return NextResponse.json({ error: "Could not parse salary response", raw: routed.result }, { status: 422 })
  }

  return NextResponse.json({ report })
}
