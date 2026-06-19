import { auth } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"

export default async function ResumeDetailPage({ params }: { params: { id: string } }) {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) redirect("/resumes")

  const resume = await prisma.resume.findFirst({
    where: { id: params.id, userId: user.id },
  })
  if (!resume) notFound()

  const content = resume.content as Record<string, unknown>

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/resumes" className="text-sm text-brand-600 hover:underline">
            ← Resumes
          </Link>
        </div>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{resume.title}</h1>
            {resume.tailoredFor && (
              <p className="text-sm text-gray-500 mt-1">Tailored for: {resume.tailoredFor}</p>
            )}
          </div>
          <div className="flex gap-3">
            <Link
              href={`/resumes/${resume.id}/tailor`}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 transition-colors text-sm"
            >
              Tailor for Job
            </Link>
            <Link
              href={`/cover-letters/new?resumeId=${resume.id}`}
              className="px-4 py-2 border border-brand-600 text-brand-600 rounded-lg font-semibold hover:bg-brand-50 transition-colors text-sm"
            >
              Write Cover Letter
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-8 space-y-6">
          {Boolean(content.name) && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{String(content.name)}</h2>
              <p className="text-gray-500 text-sm mt-1">
                {[content.email, content.phone].filter(Boolean).map(String).join(" · ")}
              </p>
            </div>
          )}

          {Boolean(content.summary) && (
            <Section title="Summary">
              <p className="text-sm text-gray-700">{content.summary as string}</p>
            </Section>
          )}

          {Array.isArray(content.skills) && content.skills.length > 0 && (
            <Section title="Skills">
              <div className="flex flex-wrap gap-2">
                {(content.skills as string[]).map((s) => (
                  <span key={s} className="px-2 py-1 bg-brand-50 text-brand-700 text-xs rounded-full">
                    {s}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {Array.isArray(content.experience) && content.experience.length > 0 && (
            <Section title="Experience">
              <div className="space-y-4">
                {(
                  content.experience as {
                    title: string
                    company: string
                    dates: string
                    bullets: string[]
                  }[]
                ).map((e, i) => (
                  <div key={i}>
                    <p className="font-semibold text-gray-800">
                      {e.title} — {e.company}
                    </p>
                    <p className="text-xs text-gray-400 mb-1">{e.dates}</p>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-0.5">
                      {(e.bullets ?? []).map((b, j) => (
                        <li key={j}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {Array.isArray(content.education) && content.education.length > 0 && (
            <Section title="Education">
              <div className="space-y-2">
                {(content.education as { degree: string; school: string; year: string }[]).map(
                  (e, i) => (
                    <div key={i}>
                      <p className="font-semibold text-gray-800 text-sm">{e.degree}</p>
                      <p className="text-xs text-gray-500">
                        {e.school} {e.year && `· ${e.year}`}
                      </p>
                    </div>
                  )
                )}
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{title}</p>
      {children}
    </div>
  )
}
