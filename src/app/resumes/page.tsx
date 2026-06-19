import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"

export default async function ResumesPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      resumes: {
        orderBy: { updatedAt: "desc" },
        select: { id: true, title: true, tailoredFor: true, score: true, updatedAt: true },
      },
    },
  })

  const resumes = user?.resumes ?? []

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Resumes</h1>
          <Link
            href="/resumes/new"
            className="px-5 py-2 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 transition-colors"
          >
            + New Resume
          </Link>
        </div>

        {resumes.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
            <p className="text-gray-500 mb-4">No resumes yet.</p>
            <Link href="/resumes/new" className="text-brand-600 font-semibold hover:underline">
              Upload your first resume
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {resumes.map((r) => (
              <Link
                key={r.id}
                href={`/resumes/${r.id}`}
                className="block bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{r.title}</p>
                    {r.tailoredFor && (
                      <p className="text-sm text-gray-500 mt-0.5">Tailored for: {r.tailoredFor}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    {r.score != null && (
                      <span
                        className={`text-sm font-bold ${
                          r.score >= 80
                            ? "text-green-600"
                            : r.score >= 60
                            ? "text-yellow-600"
                            : "text-red-500"
                        }`}
                      >
                        {r.score}/100
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(r.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
