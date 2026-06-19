"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

type ParsedResume = {
  name?: string
  email?: string
  phone?: string
  summary?: string
  skills?: string[]
  experience?: { title: string; company: string; dates: string; bullets: string[] }[]
  education?: { degree: string; school: string; year: string }[]
}

export default function NewResumePage() {
  const router = useRouter()
  const [text, setText] = useState("")
  const [title, setTitle] = useState("")
  const [parsed, setParsed] = useState<ParsedResume | null>(null)
  const [routedTo, setRoutedTo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleParse() {
    if (!text.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/resumes/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setParsed(data.parsed)
      setRoutedTo(data.meta.executed_on)
      if (!title && data.parsed.name) setTitle(`${data.parsed.name}'s Resume`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Parse failed")
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!title || !parsed) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content: parsed }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push(`/resumes/${data.resume.id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">New Resume</h1>

        {!parsed ? (
          <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Paste your resume text
            </label>
            <textarea
              className="w-full h-64 p-3 border border-gray-200 rounded-lg text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Paste your entire resume here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              onClick={handleParse}
              disabled={!text.trim() || loading}
              className="w-full py-3 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Parsing with AI..." : "Parse Resume"}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {routedTo && (
              <p className="text-xs text-gray-400">
                AI parsed via: <span className="font-mono font-bold">{routedTo}</span>
              </p>
            )}

            <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
              <h2 className="font-semibold text-gray-800">Resume Title</h2>
              <input
                className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. John Smith — Software Engineer"
              />
            </div>

            <ParsedPreview data={parsed} />

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => setParsed(null)}
                className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-lg font-semibold hover:bg-gray-50"
              >
                Re-paste
              </button>
              <button
                onClick={handleSave}
                disabled={!title || saving}
                className="flex-1 py-3 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving..." : "Save Resume"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ParsedPreview({ data }: { data: ParsedResume }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
      <h2 className="font-semibold text-gray-800">Parsed Preview</h2>

      {data.name && (
        <div>
          <p className="text-xl font-bold text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-500">
            {[data.email, data.phone].filter(Boolean).join(" · ")}
          </p>
        </div>
      )}

      {data.summary && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Summary</p>
          <p className="text-sm text-gray-700">{data.summary}</p>
        </div>
      )}

      {data.skills && data.skills.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Skills</p>
          <div className="flex flex-wrap gap-2">
            {data.skills.map((s) => (
              <span key={s} className="px-2 py-1 bg-brand-50 text-brand-700 text-xs rounded-full">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {data.experience && data.experience.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Experience
          </p>
          <div className="space-y-3">
            {data.experience.map((e, i) => (
              <div key={i}>
                <p className="font-semibold text-sm text-gray-800">
                  {e.title} — {e.company}
                </p>
                <p className="text-xs text-gray-400">{e.dates}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
