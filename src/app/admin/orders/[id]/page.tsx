import { auth } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { isAdminUser } from "@/lib/admin"
import { AdminWorkspace } from "./AdminWorkspace"

export default async function AdminOrderPage({ params }: { params: { id: string } }) {
  const { userId } = await auth()
  if (!userId || !isAdminUser(userId)) redirect("/")

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      client: { select: { email: true, name: true } },
      deliverable: true,
    },
  })
  if (!order) notFound()

  return <AdminWorkspace order={order as Parameters<typeof AdminWorkspace>[0]["order"]} />
}
