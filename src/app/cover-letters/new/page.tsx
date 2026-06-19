"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"

type Resume = { id: string; title: string }

function NewCoverLetterForm() {
  const router = useRouter()
  const params = useSearchParams()

  const [jobTitle, setJobTitle] = useState(params?.get("jobTitle") ?? "")
  const [company, setCompany] = useState(params?.get("company") ?? "")
  const [jobDescription, setJobDescription] = useState("")
  const [tone, setTone] = useState<"confident" | "formal" | "casual">("confident")
  const [resumeId, setResumeId] = useState(params?.get("resumeId") ?? "")
  const [resumes, setResumes] = useState<Resume[]>([])
  const [generated, setGenerated] = useState("")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/resumes")
      .then((r) => r.json())
      .then((d) => setResumes(d.resumes ?? []))
      .catch(() => {})
  }, [])

  async function handleGenerate() {
    if (!jobTitle || !company || !jobDescription) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/cover-letters/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId: resumeId || undefined, jobTitle, company, jobDescription, tone }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setGenerated(data.content)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Generation failed")
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!generated) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/cover-letters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTitle, company, content: generated, resumeId: resumeId || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push(`/cover-letters/${data.coverLetter.id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">New Cover Letter</h1>
        <p className="text-sm text-gray-500 mb-8">
          Claude writes a targeted cover letter — creative task, always routed to Claude.
        </p>

        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Job Title *</label>
              <input
                className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="e.g. Product Manager"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Company *</label>
              <input
                className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="e.g. Stripe"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
          </div>

          {resumes.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Resume (optional)
              </label>
              <select
                className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                value={resumeId}
                onChange={(e) => setResumeId(e.target.value)}
              >
                <option value="">No resume selected</option>
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tone</label>
            <div className="flex gap-2">
              {(["confident", "formal", "casual"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                    tone === t
                      ? "bg-brand-600 text-white"
                      : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Job Description *
            </label>
            <textarea
              className="w-full h-40 p-3 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Paste the job description..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            onClick={handleGenerate}
            disabled={!jobTitle || !company || !jobDescription || loading}
            className="w-full py-3 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Writing with Claude..." : "Generate Cover Letter"}
          </button>
        </div>

        {generated && (
          <div className="mt-6 space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-800">Generated Cover Letter</h2>
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="text-xs text-brand-600 hover:underline disabled:opacity-50"
                >
                  Regenerate
                </button>
              </div>
              <textarea
                className="w-full h-80 p-3 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 font-serif leading-relaxed"
                value={generated}
                onChange={(e) => setGenerated(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : "Save Cover Letter"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function NewCoverLetterPage() {
  return (
    <Suspense>
      <NewCoverLetterForm />
    </Suspense>
  )
}
