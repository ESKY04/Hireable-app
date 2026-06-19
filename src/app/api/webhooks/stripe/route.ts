import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"
import type Stripe from "stripe"
import { sendConfirmationEmail } from "@/lib/email"

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

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session
    if (session.mode !== "payment") return NextResponse.json({ received: true })

    const orderId = session.metadata?.orderId
    if (!orderId) return NextResponse.json({ received: true })

    const paymentId = typeof session.payment_intent === "string" ? session.payment_intent : null

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "IN_QUEUE",
        stripePaymentId: paymentId ?? undefined,
      },
      include: { client: true },
    })

    await sendConfirmationEmail(order.client.email, {
      jobTitle: order.jobTitle,
      company: order.company,
      packageType: order.packageType,
      orderId: order.id,
    }).catch(() => {})
  }

  return NextResponse.json({ received: true })
}
