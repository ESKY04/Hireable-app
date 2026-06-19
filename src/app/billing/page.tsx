import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PLAN_LIMITS } from "@/lib/stripe"
import { UpgradeButton, ManageButton } from "./BillingActions"

export default async function BillingPage({
  searchParams,
}: {
  searchParams: { success?: string; canceled?: string }
}) {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { _count: { select: { resumes: true, coverLetters: true } } },
  })

  const plan = user?.plan ?? "FREE"
  const limits = PLAN_LIMITS[plan]
  const resumeCount = user?._count.resumes ?? 0
  const coverLetterCount = user?._count.coverLetters ?? 0

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Billing</h1>

        {searchParams.success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-800 font-medium">
            You&apos;re now on Pro. All limits removed.
          </div>
        )}
        {searchParams.canceled && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-800">
            Upgrade canceled. You&apos;re still on the Free plan.
          </div>
        )}

        {/* Current plan */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-gray-500">Current Plan</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{plan}</p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                plan === "FREE"
                  ? "bg-gray-100 text-gray-600"
                  : "bg-brand-100 text-brand-700"
              }`}
            >
              {plan === "FREE" ? "Free" : "Active"}
            </span>
          </div>

          <div className="space-y-3">
            <UsageBar
              label="Resumes"
              current={resumeCount}
              limit={limits.resumes}
            />
            <UsageBar
              label="Cover Letters"
              current={coverLetterCount}
              limit={limits.coverLetters}
            />
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-2 gap-4">
          <PlanCard
            name="Free"
            price="$0"
            features={[
              `${PLAN_LIMITS.FREE.resumes} resumes`,
              `${PLAN_LIMITS.FREE.coverLetters} cover letters`,
              "AI tailoring",
              "Resume scoring",
            ]}
            current={plan === "FREE"}
          />
          <PlanCard
            name="Pro"
            price="$12/mo"
            features={[
              "Unlimited resumes",
              "Unlimited cover letters",
              "AI tailoring",
              "Resume scoring",
              "Priority support",
            ]}
            current={plan === "PRO"}
            highlighted
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {plan === "FREE" ? (
            <UpgradeButton />
          ) : (
            <ManageButton />
          )}
        </div>
      </div>
    </div>
  )
}

function UsageBar({
  label,
  current,
  limit,
}: {
  label: string
  current: number
  limit: number
}) {
  const isUnlimited = limit === Infinity
  const pct = isUnlimited ? 0 : Math.min(100, (current / limit) * 100)

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="text-gray-500">
          {current} / {isUnlimited ? "∞" : limit}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-yellow-500" : "bg-brand-500"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  )
}

function PlanCard({
  name,
  price,
  features,
  current,
  highlighted,
}: {
  name: string
  price: string
  features: string[]
  current: boolean
  highlighted?: boolean
}) {
  return (
    <div
      className={`rounded-xl p-5 border ${
        highlighted
          ? "border-brand-500 bg-brand-50"
          : "border-gray-100 bg-white"
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <p className="font-bold text-gray-900">{name}</p>
        {current && (
          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
            Current
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-brand-600 mb-4">{price}</p>
      <ul className="space-y-1.5">
        {features.map((f) => (
          <li key={f} className="text-sm text-gray-700 flex items-center gap-2">
            <span className="text-brand-500">✓</span> {f}
          </li>
        ))}
      </ul>
    </div>
  )
}
