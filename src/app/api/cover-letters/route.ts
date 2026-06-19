import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkCoverLetterLimit } from "@/lib/usage"

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ coverLetters: [] })

  const coverLetters = await prisma.coverLetter.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, jobTitle: true, company: true, createdAt: true },
  })

  return NextResponse.json({ coverLetters })
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { jobTitle, company, content, resumeId } = await req.json()
  if (!jobTitle || !company || !content) {
    return NextResponse.json({ error: "jobTitle, company, content required" }, { status: 400 })
  }

  const usage = await checkCoverLetterLimit(userId)
  if (!usage.allowed) {
    return NextResponse.json({ error: usage.reason, upgrade: true }, { status: 403 })
  }

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const coverLetter = await prisma.coverLetter.create({
    data: { userId: user.id, jobTitle, company, content, resumeId: resumeId ?? null },
  })

  return NextResponse.json({ coverLetter }, { status: 201 })
}
