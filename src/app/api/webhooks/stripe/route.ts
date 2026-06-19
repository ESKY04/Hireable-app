/**
 * POST /api/webhooks/stripe
 * Handles Stripe subscription lifecycle → updates user plan in DB.
 * Requires STRIPE_WEBHOOK_SECRET from Stripe dashboard → Webhooks.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"
import type Stripe from "stripe"

async function getUserByStripeCustomer(customerId: string) {
  return prisma.user.findFirst({ where: { stripeId: customerId } })
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })

  const payload = await req.text()
  const sig = req.headers.get("stripe-signature")

  if (!sig) return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(payload, sig, secret)
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode !== "subscription") break

      const customerId = session.customer as string
      const subscriptionId = session.subscription as string

      const user = await getUserByStripeCustomer(customerId)
      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { plan: "PRO", stripeSubscriptionId: subscriptionId },
        })
      }
      break
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string
      const user = await getUserByStripeCustomer(customerId)
      if (!user) break

      const isActive = ["active", "trialing"].includes(sub.status)
      await prisma.user.update({
        where: { id: user.id },
        data: {
          plan: isActive ? "PRO" : "FREE",
          stripeSubscriptionId: isActive ? sub.id : null,
        },
      })
      break
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string
      const user = await getUserByStripeCustomer(customerId)
      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { plan: "FREE", stripeSubscriptionId: null },
        })
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
