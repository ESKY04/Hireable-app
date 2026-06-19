import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin()
  if (error) return error

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      client: { select: { email: true, name: true } },
      deliverable: true,
    },
  })

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({ order })
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin()
  if (error) return error

  const { status, operatorNotes } = await req.json()

  const order = await prisma.order.update({
    where: { id: params.id },
    data: {
      ...(status ? { status } : {}),
      ...(operatorNotes !== undefined ? { operatorNotes } : {}),
    },
  })

  return NextResponse.json({ order })
}
