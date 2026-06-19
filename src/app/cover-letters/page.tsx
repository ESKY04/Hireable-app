import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"

export default async function CoverLettersPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      coverLetters: {
        orderBy: { createdAt: "desc" },
        select: { id: true, jobTitle: true, company: true, createdAt: true },
      },
    },
  })

  const letters = user?.coverLetters ?? []

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Cover Letters</h1>
          <Link
            href="/cover-letters/new"
            className="px-5 py-2 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 transition-colors"
          >
            + New Cover Letter
          </Link>
        </div>

        {letters.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
            <p className="text-gray-500 mb-4">No cover letters yet.</p>
            <Link
              href="/cover-letters/new"
              className="text-brand-600 font-semibold hover:underline"
            >
              Generate your first cover letter
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {letters.map((l) => (
              <Link
                key={l.id}
                href={`/cover-letters/${l.id}`}
                className="block bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{l.jobTitle}</p>
                    <p className="text-sm text-gray-500">{l.company}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(l.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
