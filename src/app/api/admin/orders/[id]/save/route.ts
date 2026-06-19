import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin()
  if (error) return error

  const { resumeContent, coverLetterContent, salaryReport, operatorNotes } = await req.json()

  const order = await prisma.order.findUnique({ where: { id: params.id } })
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const deliverable = await prisma.deliverable.upsert({
    where: { orderId: params.id },
    create: {
      orderId: params.id,
      resumeContent: resumeContent ?? null,
      coverLetterContent: coverLetterContent ?? null,
      salaryReport: salaryReport ?? undefined,
    },
    update: {
      resumeContent: resumeContent ?? undefined,
      coverLetterContent: coverLetterContent ?? undefined,
      salaryReport: salaryReport ?? undefined,
    },
  })

  if (operatorNotes !== undefined) {
    await prisma.order.update({ where: { id: params.id }, data: { operatorNotes, status: "IN_PROGRESS" } })
  }

  return NextResponse.json({ deliverable })
}
