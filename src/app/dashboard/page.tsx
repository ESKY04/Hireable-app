import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      _count: { select: { resumes: true, coverLetters: true } },
      resumes: {
        orderBy: { updatedAt: "desc" },
        take: 3,
        select: { id: true, title: true, tailoredFor: true, score: true },
      },
      coverLetters: {
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { id: true, jobTitle: true, company: true },
      },
    },
  })

  const resumeCount = user?._count.resumes ?? 0
  const coverLetterCount = user?._count.coverLetters ?? 0

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Resumes" count={resumeCount} href="/resumes" />
          <StatCard title="Cover Letters" count={coverLetterCount} href="/cover-letters" />
          <Link
            href="/resumes/new"
            className="bg-brand-600 text-white rounded-xl p-6 flex items-center justify-center font-semibold hover:bg-brand-700 transition-colors col-span-1"
          >
            + New Resume
          </Link>
          <Link
            href="/billing"
            className="border border-brand-300 text-brand-700 rounded-xl p-6 flex items-center justify-center font-semibold hover:bg-brand-50 transition-colors"
          >
            {user?._count ? "Free Plan" : "Billing"}
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Resumes */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">Recent Resumes</h2>
              <Link href="/resumes" className="text-xs text-brand-600 hover:underline">
                View all
              </Link>
            </div>
            {user?.resumes.length ? (
              <div className="space-y-3">
                {user.resumes.map((r) => (
                  <Link
                    key={r.id}
                    href={`/resumes/${r.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">{r.title}</p>
                      {r.tailoredFor && (
                        <p className="text-xs text-gray-400">{r.tailoredFor}</p>
                      )}
                    </div>
                    {r.score != null && (
                      <span
                        className={`text-sm font-bold ${
                          r.score >= 80 ? "text-green-600" : r.score >= 60 ? "text-yellow-600" : "text-red-500"
                        }`}
                      >
                        {r.score}/100
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 py-4 text-center">
                No resumes yet.{" "}
                <Link href="/resumes/new" className="text-brand-600 hover:underline">
                  Add one
                </Link>
              </p>
            )}
          </div>

          {/* Recent Cover Letters */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">Recent Cover Letters</h2>
              <Link href="/cover-letters" className="text-xs text-brand-600 hover:underline">
                View all
              </Link>
            </div>
            {user?.coverLetters.length ? (
              <div className="space-y-3">
                {user.coverLetters.map((l) => (
                  <Link
                    key={l.id}
                    href={`/cover-letters/${l.id}`}
                    className="block p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-800">{l.jobTitle}</p>
                    <p className="text-xs text-gray-400">{l.company}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 py-4 text-center">
                No cover letters yet.{" "}
                <Link href="/cover-letters/new" className="text-brand-600 hover:underline">
                  Generate one
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, count, href }: { title: string; count: number; href: string }) {
  return (
    <Link
      href={href}
      className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow block"
    >
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className="text-4xl font-bold text-brand-600">{count}</p>
    </Link>
  )
}
