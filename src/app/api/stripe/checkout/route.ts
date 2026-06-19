import { auth, currentUser } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { stripe, PACKAGES, type PackageKey } from "@/lib/stripe"

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { orderId, packageType } = body as { orderId: string; packageType: PackageKey }

  if (!orderId || !packageType || !(packageType in PACKAGES)) {
    return NextResponse.json({ error: "orderId and valid packageType required" }, { status: 400 })
  }

  const pkg = PACKAGES[packageType]

  const clerkUser = await currentUser()
  const email = clerkUser?.emailAddresses[0]?.emailAddress

  let user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) {
    user = await prisma.user.create({
      data: { clerkId: userId, email: email ?? `${userId}@clerk.local` },
    })
  }

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

  const lineItems = pkg.priceId
    ? [{ price: pkg.priceId, quantity: 1 as const }]
    : [
        {
          price_data: {
            currency: "usd",
            product_data: { name: `Hireable – ${pkg.label}` },
            unit_amount: pkg.priceCents,
          },
          quantity: 1 as const,
        },
      ]

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "payment",
    payment_method_types: ["card"],
    line_items: lineItems,
    success_url: `${appUrl}/orders/${orderId}?success=1`,
    cancel_url: `${appUrl}/request?canceled=1`,
    metadata: { orderId, clerkId: userId },
  })

  return NextResponse.json({ url: session.url })
}
