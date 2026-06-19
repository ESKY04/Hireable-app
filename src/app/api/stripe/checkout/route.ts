/**
 * POST /api/stripe/checkout
 * Creates a Stripe Checkout session for the Pro plan upgrade.
 */

import { auth, currentUser } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { stripe, PRO_PRICE_ID } from "@/lib/stripe"

export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const clerkUser = await currentUser()
  if (!clerkUser) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const email = clerkUser.emailAddresses[0]?.emailAddress

  let user = await prisma.user.findUnique({ where: { clerkId: userId } })

  // Ensure DB user exists
  if (!user) {
    user = await prisma.user.create({
      data: { clerkId: userId, email: email ?? `${userId}@clerk.local` },
    })
  }

  // Already on Pro — send to portal instead
  if (user.plan !== "FREE") {
    return NextResponse.json({ error: "Already on Pro plan" }, { status: 400 })
  }

  // Reuse or create Stripe customer
  let customerId = user.stripeId
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: email ?? undefined,
      metadata: { clerkId: userId },
    })
    customerId = customer.id
    await prisma.user.update({ where: { id: user.id }, data: { stripeId: customerId } })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: PRO_PRICE_ID, quantity: 1 }],
    success_url: `${appUrl}/billing?success=1`,
    cancel_url: `${appUrl}/billing?canceled=1`,
    metadata: { clerkId: userId },
  })

  return NextResponse.json({ url: session.url })
}
