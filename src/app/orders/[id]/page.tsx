import { auth } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { DownloadPDF } from "@/components/DownloadPDF"

const STATUS_MESSAGES: Record<string, { heading: string; body: string }> = {
  SUBMITTED: {
    heading: "Your order is being processed",
    body: "Your payment is being confirmed. This usually takes just a moment.",
  },
  IN_QUEUE: {
    heading: "You're in the queue!",
    body: "I received your order and I'm on it. I personally review every submission and build your materials from scratch. You'll get an email when everything is ready — typically within 24 hours.",
  },
  IN_PROGRESS: {
    heading: "I'm working on it",
    body: "Your package is actively being worked on right now. You'll hear from me soon.",
  },
  READY: {
    heading: "Almost there",
    body: "Your materials are ready and going through a final quality check. You'll receive your package very soon.",
  },
  DELIVERED: {
    heading: "Your package is ready!",
    body: "Everything is done. Download your materials below and go get that job.",
  },
  CANCELLED: {
    heading: "Order cancelled",
    body: "This order was cancelled. If you have questions, reply to your confirmation email.",
  },
}

const PACKAGE_LABELS: Record<string, string> = {
  COVER_LETTER: "Cover Letter",
  RESUME: "Resume Rewrite",
  FULL_SUITE: "Full Suite (Resume + Cover Letter + Salary Report)",
}

type SalaryReport = {
  low?: number
  mid?: number
  high?: number
  rationale?: string
  disclaimer?: string
}

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { success?: string }
}) {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) redirect("/orders")

  const order = await prisma.order.findFirst({
    where: { id: params.id, clientId: user.id },
    include: { deliverable: true },
  })
  if (!order) notFound()

  const msg = STATUS_MESSAGES[order.status] ?? STATUS_MESSAGES.SUBMITTED
  const isDelivered = order.status === "DELIVERED"
  const salary = order.deliverable?.salaryReport as SalaryReport | null

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/orders" className="text-sm text-brand-600 hover:underline">
            ← All Orders
          </Link>
        </div>

        {/* Success banner */}
        {searchParams.success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-green-800 font-medium">
            Payment confirmed! Your order is now in the queue.
          </div>
        )}

        {/* Order header */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {order.jobTitle} at {order.company}
              </h1>
              <p className="text-gray-500 mt-1">
                {PACKAGE_LABELS[order.packageType]} · ${(order.priceCents / 100).toFixed(2)} one-time
              </p>
            </div>
            <StatusBadge status={order.status} />
          </div>

          <div className="border-t border-gray-100 pt-4">
            <h2 className="font-semibold text-gray-900 mb-1">{msg.heading}</h2>
            <p className="text-gray-600 text-sm leading-relaxed">{msg.body}</p>
          </div>
        </div>

        {/* Delivery package */}
        {isDelivered && order.deliverable && (
          <div className="space-y-4">
            {order.deliverable.resumeContent && (
              <DeliverySection
                title="Your Tailored Resume"
                content={order.deliverable.resumeContent}
                filename={`resume-${order.jobTitle.toLowerCase().replace(/\s+/g, "-")}.pdf`}
                downloadLabel="Download Resume PDF"
              />
            )}

            {order.deliverable.coverLetterContent && (
              <DeliverySection
                title="Your Cover Letter"
                content={order.deliverable.coverLetterContent}
                filename={`cover-letter-${order.company.toLowerCase().replace(/\s+/g, "-")}.pdf`}
                downloadLabel="Download Cover Letter PDF"
              />
            )}

            {salary && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">Salary Report</h2>
                </div>
                {salary.low && salary.mid && salary.high && (
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <SalaryCard label="Low" value={salary.low} />
                    <SalaryCard label="Mid" value={salary.mid} highlight />
                    <SalaryCard label="High" value={salary.high} />
                  </div>
                )}
                {salary.rationale && (
                  <p className="text-sm text-gray-700 mb-3 leading-relaxed">{salary.rationale}</p>
                )}
                {salary.disclaimer && (
                  <p className="text-xs text-gray-400 italic">{salary.disclaimer}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Not yet delivered */}
        {!isDelivered && order.status !== "CANCELLED" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
            <div className="animate-pulse text-3xl mb-3">⏳</div>
            <p className="text-gray-600 text-sm">
              Check back here or watch your inbox — I&apos;ll email you the moment your package lands.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    SUBMITTED: "bg-gray-100 text-gray-600",
    IN_QUEUE: "bg-blue-100 text-blue-700",
    IN_PROGRESS: "bg-yellow-100 text-yellow-700",
    READY: "bg-green-100 text-green-700",
    DELIVERED: "bg-brand-100 text-brand-700",
    CANCELLED: "bg-red-100 text-red-700",
  }
  const labels: Record<string, string> = {
    SUBMITTED: "Submitted",
    IN_QUEUE: "In Queue",
    IN_PROGRESS: "In Progress",
    READY: "Ready",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
  }
  return (
    <span className={`text-sm font-semibold px-3 py-1.5 rounded-full shrink-0 ${colors[status] ?? colors.SUBMITTED}`}>
      {labels[status] ?? status}
    </span>
  )
}

function DeliverySection({
  title,
  content,
  filename,
  downloadLabel,
}: {
  title: string
  content: string
  filename: string
  downloadLabel: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <DownloadPDF content={content} filename={filename} label={downloadLabel} />
      </div>
      <div className="bg-gray-50 rounded-xl p-4 max-h-96 overflow-y-auto">
        <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
          {content}
        </pre>
      </div>
    </div>
  )
}

function SalaryCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-4 text-center ${highlight ? "bg-brand-50 border border-brand-200" : "bg-gray-50"}`}>
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-xl font-bold ${highlight ? "text-brand-700" : "text-gray-800"}`}>
        ${value.toLocaleString()}
      </p>
      <p className="text-xs text-gray-400">per year</p>
    </div>
  )
}
