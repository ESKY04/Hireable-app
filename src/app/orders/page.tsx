import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  SUBMITTED: { label: "Submitted", color: "bg-gray-100 text-gray-600" },
  IN_QUEUE: { label: "In Queue", color: "bg-blue-100 text-blue-700" },
  IN_PROGRESS: { label: "In Progress", color: "bg-yellow-100 text-yellow-700" },
  READY: { label: "Ready", color: "bg-green-100 text-green-700" },
  DELIVERED: { label: "Delivered", color: "bg-brand-100 text-brand-700" },
  CANCELLED: { label: "Cancelled", color: "bg-red-100 text-red-700" },
}

const PACKAGE_LABELS: Record<string, string> = {
  COVER_LETTER: "Cover Letter",
  RESUME: "Resume Rewrite",
  FULL_SUITE: "Full Suite",
}

export default async function OrdersPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })

  const orders = user
    ? await prisma.order.findMany({
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
    : []

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <Link
            href="/request"
            className="px-5 py-2 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 transition-colors text-sm"
          >
            + New Order
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <p className="text-2xl mb-2">📄</p>
            <p className="text-gray-700 font-semibold text-lg mb-1">No orders yet</p>
            <p className="text-gray-400 text-sm mb-6">
              Get your resume and cover letter professionally written, starting at $5.
            </p>
            <Link
              href="/request"
              className="inline-block px-6 py-3 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 transition-colors"
            >
              Place Your First Order
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const statusInfo = STATUS_LABELS[order.status] ?? STATUS_LABELS.SUBMITTED
              return (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {order.jobTitle} at {order.company}
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {PACKAGE_LABELS[order.packageType]} · ${(order.priceCents / 100).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
