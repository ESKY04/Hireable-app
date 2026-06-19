/**
 * POST /api/stripe/portal
 * Opens Stripe Customer Portal for managing/canceling subscription.
 */

import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"

export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user?.stripeId) {
    return NextResponse.json({ error: "No Stripe customer found" }, { status: 404 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeId,
    return_url: `${appUrl}/billing`,
  })

  return NextResponse.json({ url: session.url })
}
