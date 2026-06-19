import { auth, currentUser } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { PACKAGES, type PackageKey } from "@/lib/stripe"

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const {
    packageType,
    jobTitle,
    company,
    jobDescription,
    location,
    experienceLevel,
    credentials,
    currentResumeText,
  } = body as {
    packageType: PackageKey
    jobTitle: string
    company: string
    jobDescription: string
    location: string
    experienceLevel: string
    credentials: string
    currentResumeText: string
  }

  if (!packageType || !(packageType in PACKAGES)) {
    return NextResponse.json({ error: "Invalid package type" }, { status: 400 })
  }
  if (!jobTitle || !company || !jobDescription || !location || !currentResumeText) {
    return NextResponse.json({ error: "All required fields must be filled" }, { status: 400 })
  }

  const clerkUser = await currentUser()
  const email = clerkUser?.emailAddresses[0]?.emailAddress ?? `${userId}@clerk.local`

  let user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) {
    user = await prisma.user.create({ data: { clerkId: userId, email } })
  }

  const pkg = PACKAGES[packageType]

  const order = await prisma.order.create({
    data: {
      clientId: user.id,
      packageType,
      jobTitle,
      company,
      jobDescription,
      location,
      experienceLevel: experienceLevel ?? "",
      credentials: credentials ?? "",
      currentResumeText,
      priceCents: pkg.priceCents,
      status: "SUBMITTED",
    },
  })

  return NextResponse.json({ orderId: order.id }, { status: 201 })
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ orders: [] })

  const orders = await prisma.order.findMany({
    where: { clientId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      packageType: true,
      jobTitle: true,
      company: true,
      status: true,
      priceCents: true,
      createdAt: true,
      deliveredAt: true,
    },
  })

  return NextResponse.json({ orders })
}
