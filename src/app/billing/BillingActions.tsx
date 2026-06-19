"use client"

import { useState } from "react"

export function UpgradeButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleUpgrade() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      window.location.href = data.url
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to start checkout")
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2 flex-1">
      <button
        onClick={handleUpgrade}
        disabled={loading}
        className="w-full py-3 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors"
      >
        {loading ? "Redirecting to Stripe..." : "Upgrade to Pro — $12/mo"}
      </button>
      {error && <p className="text-sm text-red-500 text-center">{error}</p>}
    </div>
  )
}

export function ManageButton() {
  const [loading, setLoading] = useState(false)

  async function handlePortal() {
    setLoading(true)
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      window.location.href = data.url
    } catch {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handlePortal}
      disabled={loading}
      className="px-6 py-3 border border-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50 transition-colors"
    >
      {loading ? "Opening..." : "Manage Subscription"}
    </button>
  )
}
