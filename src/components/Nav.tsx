"use client"

import { useState } from "react"
import Link from "next/link"

export function Nav() {
  const [open, setOpen] = useState(false)

  const links = [
    { href: "/#how-it-works", label: "How It Works" },
    { href: "/#pricing", label: "Pricing" },
    { href: "/#faq", label: "FAQ" },
  ]

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl text-brand-700 tracking-tight">
          Hireable
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-gray-600 hover:text-brand-600 transition-colors font-medium"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/sign-in" className="text-sm font-semibold text-gray-600 hover:text-brand-600 transition-colors">
            Sign In
          </Link>
          <Link href="/sign-up" className="px-4 py-2 bg-brand-600 text-white rounded-lg font-semibold text-sm hover:bg-brand-700 transition-colors">
            Get Started
          </Link>
        </div>

        <button className="md:hidden p-2 text-gray-600" onClick={() => setOpen(!open)} aria-label="Toggle navigation">
          {open ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-1">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="block text-sm font-medium text-gray-700 hover:text-brand-600 py-2">
              {l.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-gray-100 flex flex-col gap-2 mt-2">
            <Link href="/sign-in" onClick={() => setOpen(false)} className="block text-center py-2.5 text-sm font-semibold text-gray-700 border border-gray-200 rounded-lg">
              Sign In
            </Link>
            <Link href="/sign-up" onClick={() => setOpen(false)} className="block text-center py-2.5 text-sm font-bold text-white bg-brand-600 rounded-lg">
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
