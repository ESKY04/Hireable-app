import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkResumeLimit } from "@/lib/usage"

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ resumes: [] })

  const resumes = await prisma.resume.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, tailoredFor: true, score: true, updatedAt: true },
  })

  return NextResponse.json({ resumes })
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { title, content } = body

  if (!title || !content) {
    return NextResponse.json({ error: "title and content required" }, { status: 400 })
  }

  // Ensure user exists before checking limits
  await prisma.user.upsert({
    where: { clerkId: userId },
    update: {},
    create: { clerkId: userId, email: body.email ?? `${userId}@clerk.local` },
  })

  const usage = await checkResumeLimit(userId)
  if (!usage.allowed) {
    return NextResponse.json({ error: usage.reason, upgrade: true }, { status: 403 })
  }

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  const resume = await prisma.resume.create({
    data: { userId: user!.id, title, content },
  })

  return NextResponse.json({ resume }, { status: 201 })
}
