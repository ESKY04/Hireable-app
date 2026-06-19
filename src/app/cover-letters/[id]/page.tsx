import { auth } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { CopyButton } from "@/components/CopyButton"

export default async function CoverLetterDetailPage({ params }: { params: { id: string } }) {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) redirect("/cover-letters")

  const letter = await prisma.coverLetter.findFirst({
    where: { id: params.id, userId: user.id },
    include: { resume: { select: { id: true, title: true } } },
  })
  if (!letter) notFound()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/cover-letters" className="text-sm text-brand-600 hover:underline">
            ← Cover Letters
          </Link>
        </div>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{letter.jobTitle}</h1>
            <p className="text-gray-500 mt-1">{letter.company}</p>
          </div>
          <div className="flex gap-2">
            <CopyButton text={letter.content} />
            {letter.resume && (
              <Link
                href={`/resumes/${letter.resume.id}`}
                className="px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
              >
                View Resume
              </Link>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-8">
          <div className="prose prose-sm max-w-none">
            {letter.content.split("\n\n").map((paragraph, i) => (
              <p key={i} className="text-gray-800 leading-relaxed mb-4 font-serif">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-400 text-right">
          Created {new Date(letter.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  )
}

