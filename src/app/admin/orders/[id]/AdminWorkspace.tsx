"use client"

import { useState } from "react"
import Link from "next/link"

type SalaryReport = {
  low?: number
  mid?: number
  high?: number
  rationale?: string
  disclaimer?: string
}

type OrderForWorkspace = {
  id: string
  jobTitle: string
  company: string
  location: string
  experienceLevel: string
  packageType: string
  status: string
  priceCents: number
  jobDescription: string
  credentials: string
  currentResumeText: string
  operatorNotes: string | null
  client: { email: string; name: string | null }
  deliverable: {
    resumeContent: string | null
    coverLetterContent: string | null
    salaryReport: unknown
    approvedAt: Date | null
  } | null
}

export function AdminWorkspace({ order }: { order: OrderForWorkspace }) {
  const [resumeDraft, setResumeDraft] = useState(order.deliverable?.resumeContent ?? "")
  const [coverLetterDraft, setCoverLetterDraft] = useState(order.deliverable?.coverLetterContent ?? "")
  const [salaryDraft, setSalaryDraft] = useState<SalaryReport | null>(
    (order.deliverable?.salaryReport as SalaryReport) ?? null
  )
  const [notes, setNotes] = useState(order.operatorNotes ?? "")
  const [tone, setTone] = useState<"confident" | "formal" | "casual">("confident")
  const [loading, setLoading] = useState<string | null>(null)
  const [status, setStatus] = useState(order.status)
  const [saved, setSaved] = useState(false)
  const [approved, setApproved] = useState(!!order.deliverable?.approvedAt)
  const [error, setError] = useState<string | null>(null)

  const pkg = order.packageType
  const showResume = pkg === "RESUME" || pkg === "FULL_SUITE"
  const showCoverLetter = pkg === "COVER_LETTER" || pkg === "FULL_SUITE"
  const showSalary = pkg === "FULL_SUITE"

  async function callAdmin(path: string, body?: Record<string, unknown>) {
    const res = await fetch(`/api/admin/orders/${order.id}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? `Failed: ${path}`)
    return data
  }

  async function handleGenerate(type: "tailor" | "cover-letter" | "salary" | "parse") {
    setLoading(type)
    setError(null)
    try {
      if (type === "parse") {
        const data = await callAdmin("parse")
        setResumeDraft(JSON.stringify(data.parsed, null, 2))
      } else if (type === "tailor") {
        const data = await callAdmin("tailor")
        setResumeDraft(data.content)
      } else if (type === "cover-letter") {
        const data = await callAdmin("cover-letter", { tone })
        setCoverLetterDraft(data.content)
      } else if (type === "salary") {
        const data = await callAdmin("salary")
        setSalaryDraft(data.report)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error")
    } finally {
      setLoading(null)
    }
  }

  async function handleSaveDraft() {
    setLoading("save")
    setError(null)
    try {
      await callAdmin("save", {
        resumeContent: resumeDraft || null,
        coverLetterContent: coverLetterDraft || null,
        salaryReport: salaryDraft || null,
        operatorNotes: notes,
      })
      setSaved(true)
      setStatus("IN_PROGRESS")
      setTimeout(() => setSaved(false), 2000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed")
    } finally {
      setLoading(null)
    }
  }

  async function handleApprove() {
    if (!confirm("Approve & send this package to the client? This cannot be undone.")) return
    setLoading("approve")
    setError(null)
    try {
      await callAdmin("approve", {
        resumeContent: resumeDraft || null,
        coverLetterContent: coverLetterDraft || null,
        salaryReport: salaryDraft || null,
      })
      setApproved(true)
      setStatus("DELIVERED")
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Approve failed")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <Link href="/admin/queue" className="text-xs text-gray-500 hover:text-gray-300 mb-2 block">
              ← Queue
            </Link>
            <h1 className="text-xl font-bold">
              {order.jobTitle} at {order.company}
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {order.client.email} · {order.packageType.replace("_", " ")} · ${(order.priceCents / 100).toFixed(2)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={status} />
            {approved && (
              <span className="text-xs bg-green-900 text-green-300 px-3 py-1 rounded-full font-semibold">
                Delivered
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* LEFT: Client inputs */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Client Inputs</h2>

            <InfoBlock label="Target Role" value={`${order.jobTitle} at ${order.company}`} />
            <InfoBlock label="Location" value={order.location} />
            <InfoBlock label="Experience Level" value={order.experienceLevel} />
            {order.credentials && <InfoBlock label="Credentials" value={order.credentials} />}

            <div>
              <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Job Description</p>
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 max-h-48 overflow-y-auto">
                <pre className="text-xs text-gray-300 whitespace-pre-wrap font-sans">{order.jobDescription}</pre>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Pasted Resume</p>
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 max-h-64 overflow-y-auto">
                <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">{order.currentResumeText}</pre>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Operator Notes</p>
              <textarea
                className="w-full h-20 bg-gray-900 border border-gray-800 rounded-lg p-3 text-xs text-gray-200 resize-none focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="Internal notes (not shown to client)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* RIGHT: Drafts + AI actions */}
          <div className="space-y-5">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Drafts</h2>

            {showResume && (
              <DraftSection
                title="Resume"
                value={resumeDraft}
                onChange={setResumeDraft}
                actions={
                  <div className="flex gap-2">
                    <ActionButton
                      label="Parse Raw"
                      loading={loading === "parse"}
                      onClick={() => handleGenerate("parse")}
                    />
                    <ActionButton
                      label="Generate Tailored"
                      loading={loading === "tailor"}
                      onClick={() => handleGenerate("tailor")}
                      primary
                    />
                  </div>
                }
              />
            )}

            {showCoverLetter && (
              <DraftSection
                title="Cover Letter"
                value={coverLetterDraft}
                onChange={setCoverLetterDraft}
                actions={
                  <div className="flex gap-2 items-center">
                    <select
                      value={tone}
                      onChange={(e) => setTone(e.target.value as typeof tone)}
                      className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-200 focus:outline-none"
                    >
                      <option value="confident">Confident</option>
                      <option value="formal">Formal</option>
                      <option value="casual">Casual</option>
                    </select>
                    <ActionButton
                      label="Generate"
                      loading={loading === "cover-letter"}
                      onClick={() => handleGenerate("cover-letter")}
                      primary
                    />
                  </div>
                }
              />
            )}

            {showSalary && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Salary Report</p>
                  <ActionButton
                    label="Generate Salary"
                    loading={loading === "salary"}
                    onClick={() => handleGenerate("salary")}
                    primary
                  />
                </div>
                {salaryDraft ? (
                  <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 text-sm">
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      {(["low", "mid", "high"] as const).map((k) => (
                        <div key={k} className="text-center">
                          <p className="text-xs text-gray-500 uppercase">{k}</p>
                          <p className="font-bold text-brand-400">${salaryDraft[k]?.toLocaleString() ?? "—"}</p>
                        </div>
                      ))}
                    </div>
                    {salaryDraft.rationale && (
                      <p className="text-xs text-gray-400 mb-2">{salaryDraft.rationale}</p>
                    )}
                    {salaryDraft.disclaimer && (
                      <p className="text-xs text-gray-600 italic">{salaryDraft.disclaimer}</p>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center text-xs text-gray-600">
                    Click Generate Salary to estimate the range.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 bg-red-900/40 border border-red-800 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Action bar */}
        {!approved && (
          <div className="mt-8 flex gap-4 items-center border-t border-gray-800 pt-6">
            <button
              onClick={handleSaveDraft}
              disabled={!!loading}
              className="px-6 py-2.5 bg-gray-800 text-gray-200 rounded-lg font-semibold text-sm hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {loading === "save" ? "Saving..." : saved ? "Saved!" : "Save Draft"}
            </button>
            <button
              onClick={handleApprove}
              disabled={!!loading}
              className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-bold text-sm hover:bg-green-500 disabled:opacity-50 transition-colors"
            >
              {loading === "approve" ? "Sending..." : "Approve & Send to Client"}
            </button>
            <p className="text-xs text-gray-600 ml-auto">
              Approve & Send is the only path to DELIVERED.
            </p>
          </div>
        )}

        {approved && (
          <div className="mt-8 p-4 bg-green-900/30 border border-green-800 rounded-xl text-green-300 text-sm">
            Package delivered and email sent to client.
          </div>
        )}
      </div>
    </div>
  )
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-gray-200">{value}</p>
    </div>
  )
}

function DraftSection({
  title,
  value,
  onChange,
  actions,
}: {
  title: string
  value: string
  onChange: (v: string) => void
  actions: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">{title}</p>
        {actions}
      </div>
      <textarea
        className="w-full h-52 bg-gray-900 border border-gray-800 rounded-lg p-3 text-xs text-gray-200 resize-none focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono leading-relaxed"
        placeholder={`${title} draft will appear here after generation. You can edit before approving.`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

function ActionButton({
  label,
  loading,
  onClick,
  primary,
}: {
  label: string
  loading: boolean
  onClick: () => void
  primary?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`px-3 py-1.5 rounded text-xs font-semibold disabled:opacity-50 transition-colors ${
        primary
          ? "bg-brand-600 text-white hover:bg-brand-500"
          : "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
      }`}
    >
      {loading ? "Working..." : label}
    </button>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    SUBMITTED: "bg-gray-800 text-gray-400",
    IN_QUEUE: "bg-blue-900 text-blue-300",
    IN_PROGRESS: "bg-yellow-900 text-yellow-300",
    READY: "bg-green-900 text-green-300",
    DELIVERED: "bg-brand-900 text-brand-300",
    CANCELLED: "bg-red-900 text-red-300",
  }
  return (
    <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${colors[status] ?? colors.SUBMITTED}`}>
      {status.replace("_", " ")}
    </span>
  )
}
