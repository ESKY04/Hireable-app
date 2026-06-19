import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"

export async function GET(req: Request) {
  const { error } = await requireAdmin()
  if (error) return error

  const url = new URL(req.url)
  const status = url.searchParams.get("status")

  const orders = await prisma.order.findMany({
    where: status ? { status: status as never } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { email: true, name: true } },
      deliverable: { select: { approvedAt: true } },
    },
  })

  return NextResponse.json({ orders })
}
