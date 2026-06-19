/**
 * POST /api/webhooks/clerk
 * Syncs Clerk user lifecycle events to Postgres.
 * Requires CLERK_WEBHOOK_SECRET in env (from Clerk dashboard → Webhooks).
 */

import { Webhook } from "svix"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type ClerkUserEvent = {
  type: "user.created" | "user.updated" | "user.deleted"
  data: {
    id: string
    email_addresses: { email_address: string; id: string }[]
    primary_email_address_id: string
    first_name: string | null
    last_name: string | null
  }
}

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })

  const headersList = await headers()
  const svixId = headersList.get("svix-id")
  const svixTimestamp = headersList.get("svix-timestamp")
  const svixSignature = headersList.get("svix-signature")

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 })
  }

  const payload = await req.text()

  let event: ClerkUserEvent
  try {
    const wh = new Webhook(secret)
    event = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkUserEvent
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const { type, data } = event

  const primaryEmail = data.email_addresses.find(
    (e) => e.id === data.primary_email_address_id
  )?.email_address

  const name = [data.first_name, data.last_name].filter(Boolean).join(" ") || null

  if (type === "user.created" || type === "user.updated") {
    if (!primaryEmail) return NextResponse.json({ error: "No email" }, { status: 400 })

    await prisma.user.upsert({
      where: { clerkId: data.id },
      update: { email: primaryEmail, name },
      create: { clerkId: data.id, email: primaryEmail, name },
    })
  }

  if (type === "user.deleted") {
    await prisma.user.deleteMany({ where: { clerkId: data.id } })
  }

  return NextResponse.json({ received: true })
}
