import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { isAdminUser } from "@/lib/admin"

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: "bg-gray-100 text-gray-600",
  IN_QUEUE: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700",
  READY: "bg-green-100 text-green-700",
  DELIVERED: "bg-brand-100 text-brand-700",
  CANCELLED: "bg-red-100 text-red-700",
}

const ALL_STATUSES = ["SUBMITTED", "IN_QUEUE", "IN_PROGRESS", "READY", "DELIVERED", "CANCELLED"]

const PACKAGE_SHORT: Record<string, string> = {
  COVER_LETTER: "Cover Letter",
  RESUME: "Resume",
  FULL_SUITE: "Full Suite",
}

export default async function AdminQueuePage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const { userId } = await auth()
  if (!userId || !isAdminUser(userId)) redirect("/")

  const statusFilter = searchParams.status && ALL_STATUSES.includes(searchParams.status)
    ? searchParams.status
    : undefined

  const orders = await prisma.order.findMany({
    where: statusFilter ? { status: statusFilter as never } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { email: true, name: true } },
      deliverable: { select: { approvedAt: true } },
    },
  })

  const counts = await prisma.order.groupBy({
    by: ["status"],
    _count: { id: true },
  })
  const countMap = Object.fromEntries(counts.map((c) => [c.status, c._count.id]))

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Order Queue</h1>
            <p className="text-gray-400 text-sm mt-1">Hireable Operator Dashboard</p>
          </div>
          <div className="text-xs text-gray-500">{orders.length} order{orders.length !== 1 ? "s" : ""}</div>
        </div>

        {/* Status filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Link
            href="/admin/queue"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              !statusFilter ? "bg-white text-gray-900" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            All ({Object.values(countMap).reduce((a, b) => a + b, 0)})
          </Link>
          {ALL_STATUSES.map((s) => (
            <Link
              key={s}
              href={`/admin/queue?status=${s}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === s ? "bg-white text-gray-900" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {s.replace("_", " ")} ({countMap[s] ?? 0})
            </Link>
          ))}
        </div>

        {/* Table */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          {orders.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No orders found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wide">
                  <th className="text-left p-4">Client</th>
                  <th className="text-left p-4">Role</th>
                  <th className="text-left p-4">Package</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Date</th>
                  <th className="text-left p-4"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-gray-800 last:border-0 hover:bg-gray-800 transition-colors"
                  >
                    <td className="p-4">
                      <p className="font-medium text-gray-200">{order.client.email}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-gray-200">{order.jobTitle}</p>
                      <p className="text-xs text-gray-500">{order.company}</p>
                    </td>
                    <td className="p-4 text-gray-400">{PACKAGE_SHORT[order.packageType]}</td>
                    <td className="p-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[order.status]}`}>
                        {order.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500 text-xs">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-xs text-brand-400 hover:text-brand-300 font-semibold"
                      >
                        Open →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
