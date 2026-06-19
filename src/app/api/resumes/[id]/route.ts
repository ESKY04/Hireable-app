import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

async function getOwned(userId: string, resumeId: string) {
  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return null
  return prisma.resume.findFirst({ where: { id: resumeId, userId: user.id } })
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const resume = await getOwned(userId, params.id)
  if (!resume) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({ resume })
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const resume = await getOwned(userId, params.id)
  if (!resume) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json()
  const updated = await prisma.resume.update({
    where: { id: params.id },
    data: {
      ...(body.title && { title: body.title }),
      ...(body.content && { content: body.content }),
      ...(body.tailoredFor !== undefined && { tailoredFor: body.tailoredFor }),
      ...(body.score !== undefined && { score: body.score }),
    },
  })

  return NextResponse.json({ resume: updated })
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const resume = await getOwned(userId, params.id)
  if (!resume) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.resume.delete({ where: { id: params.id } })
  return NextResponse.json({ deleted: true })
}
