"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

type PackageKey = "COVER_LETTER" | "RESUME" | "FULL_SUITE"

const PACKAGES: Record<PackageKey, { label: string; price: string; priceCents: number; features: string[]; badge?: string }> = {
  COVER_LETTER: {
    label: "Cover Letter",
    price: "$5",
    priceCents: 500,
    features: ["Tailored to the specific role", "Delivered within 24 hours", "One round of revisions"],
  },
  RESUME: {
    label: "Resume Rewrite",
    price: "$8",
    priceCents: 800,
    features: ["Bullets rewritten for the role", "Keywords optimized", "Delivered within 24 hours", "One round of revisions"],
  },
  FULL_SUITE: {
    label: "Full Suite",
    price: "$10",
    priceCents: 1000,
    badge: "Founder Pricing — Best Value",
    features: [
      "Resume rewritten for the role",
      "Cover letter crafted",
      "Salary range report",
      "Delivered within 24 hours",
      "One round of revisions",
    ],
  },
}

const EXPERIENCE_LEVELS = ["Entry Level (0–2 yrs)", "Mid Level (3–5 yrs)", "Senior (6–10 yrs)", "Director / VP", "C-Suite / Executive"]

export default function RequestPage() {
  const router = useRouter()
  const [pkg, setPkg] = useState<PackageKey>("FULL_SUITE")
  const [jobTitle, setJobTitle] = useState("")
  const [company, setCompany] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [location, setLocation] = useState("")
  const [experienceLevel, setExperienceLevel] = useState(EXPERIENCE_LEVELS[1])
  const [credentials, setCredentials] = useState("")
  const [currentResumeText, setCurrentResumeText] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!jobTitle || !company || !jobDescription || !location || !currentResumeText) {
      setError("Please fill in all required fields.")
      return
    }
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageType: pkg, jobTitle, company, jobDescription, location, experienceLevel, credentials, currentResumeText }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to create order")

      const checkoutRes = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: data.orderId, packageType: pkg }),
      })
      const checkoutData = await checkoutRes.json()
      if (!checkoutRes.ok) throw new Error(checkoutData.error ?? "Failed to start checkout")

      window.location.href = checkoutData.url
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong")
      setLoading(false)
    }
  }

  const selected = PACKAGES[pkg]

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Request Your Package</h1>
          <p className="text-gray-500 text-lg">Fill in the details below. I&apos;ll handle the rest and deliver to your inbox.</p>
        </div>

        {/* Package selector */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {(Object.keys(PACKAGES) as PackageKey[]).map((key) => {
            const p = PACKAGES[key]
            const isSelected = pkg === key
            return (
              <button
                key={key}
                onClick={() => setPkg(key)}
                className={`relative rounded-xl border-2 p-5 text-left transition-all ${
                  isSelected ? "border-brand-600 bg-brand-50" : "border-gray-200 bg-white hover:border-brand-300"
                }`}
              >
                {p.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                    {p.badge}
                  </span>
                )}
                <p className="font-bold text-gray-900 text-base mt-1">{p.label}</p>
                <p className="text-2xl font-bold text-brand-600 my-1">{p.price}</p>
                <ul className="space-y-1 mt-3">
                  {p.features.map((f) => (
                    <li key={f} className="text-xs text-gray-600 flex gap-1.5 items-start">
                      <span className="text-brand-500 font-bold mt-0.5">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </button>
            )
          })}
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-6">
          <h2 className="text-xl font-bold text-gray-900">Your Target Role</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
              <input
                className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="e.g. Senior Product Manager"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
              <input
                className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="e.g. Stripe"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
              <input
                className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="e.g. San Francisco, CA / Remote"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level</label>
              <select
                className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
              >
                {EXPERIENCE_LEVELS.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Description *</label>
            <textarea
              className="w-full h-40 p-3 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Paste the full job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notable credentials, degrees, or context <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              className="w-full h-24 p-3 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="e.g. MBA from Stanford, 5 years at Google, certified PMP..."
              value={credentials}
              onChange={(e) => setCredentials(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Current Resume *
              <span className="ml-2 text-gray-400 font-normal">Paste the text from your existing resume</span>
            </label>
            <textarea
              className="w-full h-52 p-3 border border-gray-200 rounded-lg text-sm resize-none font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Paste your resume text here (any format is fine — I'll clean it up)..."
              value={currentResumeText}
              onChange={(e) => setCurrentResumeText(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-4 bg-brand-600 text-white rounded-xl font-bold text-lg hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            {loading
              ? "Creating your order..."
              : `Proceed to Payment — ${selected.price}`}
          </button>

          <p className="text-center text-xs text-gray-400">
            Secured by Stripe · 100% money-back guarantee · No subscription
          </p>
        </div>
      </div>
    </div>
  )
}
