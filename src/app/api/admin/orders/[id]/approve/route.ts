import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"
import { sendDeliveryEmail } from "@/lib/email"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin()
  if (error) return error

  const { resumeContent, coverLetterContent, salaryReport } = await req.json()

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { client: true },
  })
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const now = new Date()

  await prisma.deliverable.upsert({
    where: { orderId: params.id },
    create: {
      orderId: params.id,
      resumeContent: resumeContent ?? null,
      coverLetterContent: coverLetterContent ?? null,
      salaryReport: salaryReport ?? undefined,
      approvedAt: now,
    },
    update: {
      resumeContent: resumeContent ?? undefined,
      coverLetterContent: coverLetterContent ?? undefined,
      salaryReport: salaryReport ?? undefined,
      approvedAt: now,
    },
  })

  await prisma.order.update({
    where: { id: params.id },
    data: { status: "DELIVERED", deliveredAt: now },
  })

  await sendDeliveryEmail(order.client.email, {
    jobTitle: order.jobTitle,
    company: order.company,
    packageType: order.packageType,
    orderId: order.id,
  }).catch(() => {})

  return NextResponse.json({ success: true })
}
