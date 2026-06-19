"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"

type ScoreAnalysis = {
  score: number
  strengths: string[]
  gaps: string[]
  keywords_matched: string[]
  keywords_missing: string[]
  recommendation: string
}

export default function TailorPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params?.id ?? ""

  const [jobTitle, setJobTitle] = useState("")
  const [company, setCompany] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [mode, setMode] = useState<"tailor" | "score">("tailor")
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<ScoreAnalysis | null>(null)
  const [tailored, setTailored] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleTailor() {
    if (!jobDescription.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/resumes/${id}/tailor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTitle, company, jobDescription }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setTailored(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed")
    } finally {
      setLoading(false)
    }
  }

  async function handleScore() {
    if (!jobDescription.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/resumes/${id}/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAnalysis(data.analysis)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href={`/resumes/${id}`} className="text-sm text-brand-600 hover:underline">
            ← Back to Resume
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tailor for a Job</h1>
        <p className="text-sm text-gray-500 mb-8">
          AI rewrites your bullets to match the job — powered by Claude (reasoning task).
        </p>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-6">
          {(["tailor", "score"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setAnalysis(null); setTailored(false) }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                mode === m
                  ? "bg-brand-600 text-white"
                  : "border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {m === "tailor" ? "Tailor Resume" : "Score & Gap Analysis"}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          {mode === "tailor" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Job Title</label>
                <input
                  className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="e.g. Senior Software Engineer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Company</label>
                <input
                  className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="e.g. Stripe"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Job Description</label>
            <textarea
              className="w-full h-48 p-3 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Paste the full job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            onClick={mode === "tailor" ? handleTailor : handleScore}
            disabled={!jobDescription.trim() || loading}
            className="w-full py-3 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {loading
              ? mode === "tailor" ? "Tailoring with Claude..." : "Scoring with Claude..."
              : mode === "tailor" ? "Tailor My Resume" : "Analyze & Score"}
          </button>
        </div>

        {/* Tailor success */}
        {tailored && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-6 text-center space-y-3">
            <p className="text-green-800 font-semibold">Resume tailored successfully.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => router.push(`/resumes/${id}`)}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700"
              >
                View Updated Resume
              </button>
              <Link
                href={`/cover-letters/new?resumeId=${id}&jobTitle=${encodeURIComponent(jobTitle)}&company=${encodeURIComponent(company)}`}
                className="px-4 py-2 border border-brand-600 text-brand-600 rounded-lg text-sm font-semibold hover:bg-brand-50"
              >
                Write Cover Letter
              </Link>
            </div>
          </div>
        )}

        {/* Score results */}
        {analysis && <ScoreCard analysis={analysis} />}
      </div>
    </div>
  )
}

function ScoreCard({ analysis }: { analysis: ScoreAnalysis }) {
  const color =
    analysis.score >= 80 ? "text-green-600" : analysis.score >= 60 ? "text-yellow-600" : "text-red-500"

  return (
    <div className="mt-6 bg-white rounded-xl border border-gray-100 p-6 space-y-5">
      <div className="flex items-center gap-4">
        <span className={`text-5xl font-bold ${color}`}>{analysis.score}</span>
        <div>
          <p className="font-semibold text-gray-900">Match Score</p>
          <p className="text-sm text-gray-500">{analysis.recommendation}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <TagList title="Strengths" items={analysis.strengths} color="green" />
        <TagList title="Gaps" items={analysis.gaps} color="red" />
        <TagList title="Keywords Matched" items={analysis.keywords_matched} color="blue" />
        <TagList title="Keywords Missing" items={analysis.keywords_missing} color="orange" />
      </div>
    </div>
  )
}

function TagList({
  title,
  items,
  color,
}: {
  title: string
  items: string[]
  color: "green" | "red" | "blue" | "orange"
}) {
  const styles = {
    green: "bg-green-50 text-green-700",
    red: "bg-red-50 text-red-700",
    blue: "bg-blue-50 text-blue-700",
    orange: "bg-orange-50 text-orange-700",
  }
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span key={item} className={`text-xs px-2 py-1 rounded-full ${styles[color]}`}>
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
