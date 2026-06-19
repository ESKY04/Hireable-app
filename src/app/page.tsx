import type { Metadata } from "next"
import Link from "next/link"
import { Nav } from "@/components/Nav"

export const metadata: Metadata = {
  title: "Hireable – Professional Resume & Cover Letter Writing Service",
  description:
    "Get a professionally written, job-tailored resume and cover letter delivered to your inbox within 24 hours. Starting at $5. No subscription.",
  openGraph: {
    title: "Hireable – Resume & Cover Letter Writing",
    description: "A real person rewrites your resume and cover letter for your target job. Delivered within 24 hours. Starting at $5.",
    type: "website",
    url: process.env.NEXT_PUBLIC_APP_URL ?? "https://hireable.work",
    siteName: "Hireable",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hireable – Resume & Cover Letter Writing",
    description: "A real person rewrites your resume and cover letter for your target job. Delivered within 24 hours. Starting at $5.",
  },
}

const STEPS = [
  {
    num: "1",
    title: "Tell me about the role",
    body: "Paste the job posting, share your current resume, and pick your package. Takes about 3 minutes.",
  },
  {
    num: "2",
    title: "I get to work",
    body: "I personally review your background, study the job requirements, and write materials tailored specifically to that role.",
  },
  {
    num: "3",
    title: "Your package arrives",
    body: "You get a polished, ready-to-send resume and cover letter in your inbox — typically within 24 hours.",
  },
]

const PACKAGES = [
  {
    key: "COVER_LETTER",
    label: "Cover Letter",
    price: "$5",
    features: ["Tailored to the specific role", "Hook, achievement story, CTA", "Delivered within 24 hours", "One round of revisions"],
  },
  {
    key: "RESUME",
    label: "Resume Rewrite",
    price: "$8",
    features: ["Bullets rewritten for the role", "Keywords aligned to the posting", "Delivered within 24 hours", "One round of revisions"],
  },
  {
    key: "FULL_SUITE",
    label: "Full Suite",
    price: "$10",
    badge: "Founder Pricing · Best Value",
    highlight: true,
    features: [
      "Resume rewritten for the role",
      "Cover letter crafted",
      "Realistic salary range for your market",
      "Delivered within 24 hours",
      "One round of revisions",
    ],
    note: "Launch pricing while I build my portfolio. Price goes up soon.",
  },
]

const FAQS = [
  {
    q: "How long does it take?",
    a: "Most orders are delivered within 24 hours. I'll email you as soon as your materials are ready.",
  },
  {
    q: "Do I get revisions?",
    a: "Yes — every order includes one round of revisions. If something isn't right, just reply to your delivery email and I'll fix it.",
  },
  {
    q: "What's in the Full Suite?",
    a: "A tailored resume rewrite, a cover letter written for that specific role, and a salary range report for your target position in your location. Everything you need in one package.",
  },
  {
    q: "Is my information private?",
    a: "Your resume and job information are used only to prepare your package and are never shared or sold.",
  },
  {
    q: "What if I'm not happy with the results?",
    a: "If your materials aren't better than what you started with, I'll refund you — no questions asked.",
  },
  {
    q: "Do I need to create an account?",
    a: "Yes — a free account lets you track your order and download your materials. Sign up takes under 30 seconds.",
  },
]

export default function HomePage() {
  return (
    <>
      <Nav />
      <main className="pt-16">
        {/* HERO */}
        <section className="bg-gradient-to-b from-brand-950 to-brand-900 text-white px-4 py-24 md:py-32 text-center">
          <div className="max-w-4xl mx-auto">
            <p className="text-brand-300 text-sm font-semibold uppercase tracking-widest mb-4">
              Done-for-you · Starting at $5
            </p>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
              Your resume, rewritten.<br />
              Your cover letter, crafted.<br />
              <span className="text-brand-300">Done while you sleep.</span>
            </h1>
            <p className="text-brand-200 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              Send me your current resume and a job posting. I personally review your background, rewrite your materials for that specific role, and deliver everything to your inbox — typically within 24 hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/sign-up"
                className="px-8 py-4 bg-brand-500 hover:bg-brand-400 text-white font-bold rounded-xl text-lg transition-colors"
              >
                Get My Package — from $5
              </Link>
              <Link
                href="/#how-it-works"
                className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-lg transition-colors border border-white/20"
              >
                See How It Works
              </Link>
            </div>
            <p className="text-brand-400 text-sm mt-6">No subscription · 100% money-back guarantee · Delivered in 24 hrs</p>
          </div>
        </section>

        {/* TRUST BAR */}
        <section className="bg-white border-b border-gray-100 py-5 px-4">
          <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-6 md:gap-12 text-sm text-gray-500 font-medium">
            {["100% Money-Back Guarantee", "Delivered in 24 Hours", "One Round of Revisions Included", "Secured by Stripe"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <span className="text-brand-500">✓</span> {t}
              </span>
            ))}
          </div>
        </section>

        {/* BEFORE / AFTER */}
        <section className="bg-gray-50 px-4 py-20">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              From generic to impossible to ignore
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-4">Before</p>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500 font-semibold">Marketing Manager · Acme Corp · 2020–2023</p>
                  <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                    <li>Responsible for social media management</li>
                    <li>Helped with campaign planning</li>
                    <li>Worked on email marketing</li>
                    <li>Supported sales team with materials</li>
                  </ul>
                </div>
              </div>
              <div className="bg-brand-950 border border-brand-800 rounded-2xl p-6">
                <p className="text-xs font-bold uppercase tracking-wide text-brand-400 mb-4">After</p>
                <div className="space-y-2">
                  <p className="text-sm text-brand-200 font-semibold">Marketing Manager · Acme Corp · 2020–2023</p>
                  <ul className="list-disc list-inside text-sm text-brand-300 space-y-1">
                    <li>Grew Instagram following 3× to 45K in 8 months by shifting to video-first content</li>
                    <li>Launched Q3 product campaign that generated $280K pipeline, 40% above target</li>
                    <li>Rebuilt email nurture sequence, lifting open rates from 18% to 31%</li>
                    <li>Built a sales enablement library of 12 assets used across 3 product lines</li>
                  </ul>
                </div>
              </div>
            </div>
            <p className="text-center text-xs text-gray-400 mt-4">Sample rewrite — actual results depend on your background.</p>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="bg-white px-4 py-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">How it works</h2>
            <p className="text-center text-gray-500 mb-12">Three steps. You do step 1. I handle the rest.</p>
            <div className="grid md:grid-cols-3 gap-8">
              {STEPS.map((s) => (
                <div key={s.num} className="text-center">
                  <div className="w-12 h-12 rounded-full bg-brand-600 text-white font-bold text-xl flex items-center justify-center mx-auto mb-4">
                    {s.num}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.body}</p>
                </div>
              ))}
            </div>
            <div className="mt-12 text-center">
              <Link href="/sign-up" className="inline-block px-8 py-4 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors">
                Start Now — from $5
              </Link>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="bg-gray-50 px-4 py-20">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Simple, one-time pricing</h2>
            <p className="text-center text-gray-500 mb-12">No subscription. Pay once, get your materials.</p>
            <div className="grid md:grid-cols-3 gap-6">
              {PACKAGES.map((p) => (
                <div
                  key={p.key}
                  className={`relative rounded-2xl border-2 p-7 flex flex-col ${
                    p.highlight
                      ? "border-brand-600 bg-brand-950 text-white"
                      : "border-gray-200 bg-white text-gray-900"
                  }`}
                >
                  {p.badge && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                      {p.badge}
                    </span>
                  )}
                  <div className="mb-5">
                    <p className={`font-bold text-lg mb-1 ${p.highlight ? "text-white" : "text-gray-900"}`}>{p.label}</p>
                    <p className={`text-4xl font-extrabold ${p.highlight ? "text-brand-300" : "text-brand-600"}`}>{p.price}</p>
                    <p className={`text-xs mt-1 ${p.highlight ? "text-brand-400" : "text-gray-400"}`}>one-time payment</p>
                  </div>
                  <ul className="space-y-2.5 flex-1 mb-6">
                    {p.features.map((f) => (
                      <li key={f} className={`flex gap-2 text-sm ${p.highlight ? "text-brand-200" : "text-gray-600"}`}>
                        <span className={`font-bold mt-0.5 ${p.highlight ? "text-brand-400" : "text-brand-500"}`}>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  {p.note && (
                    <p className="text-xs text-brand-400 italic mb-4">{p.note}</p>
                  )}
                  <Link
                    href="/sign-up"
                    className={`block text-center py-3 rounded-xl font-bold text-sm transition-colors ${
                      p.highlight
                        ? "bg-brand-500 hover:bg-brand-400 text-white"
                        : "bg-brand-600 hover:bg-brand-700 text-white"
                    }`}
                  >
                    Get {p.label}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* GUARANTEE */}
        <section className="bg-brand-600 text-white px-4 py-16 text-center">
          <div className="max-w-2xl mx-auto">
            <p className="text-4xl mb-4">🛡️</p>
            <h2 className="text-2xl font-bold mb-3">100% Money-Back Guarantee</h2>
            <p className="text-brand-100 leading-relaxed">
              If your materials aren&apos;t noticeably better than what you started with, I&apos;ll refund every dollar — no questions asked. I stand behind my work.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="bg-white px-4 py-20">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Frequently asked questions</h2>
            <div className="space-y-6">
              {FAQS.map((f) => (
                <div key={f.q} className="border-b border-gray-100 pb-6">
                  <p className="font-semibold text-gray-900 mb-2">{f.q}</p>
                  <p className="text-gray-500 text-sm leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="bg-gray-950 text-white px-4 py-20 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">Ready to land that interview?</h2>
            <p className="text-gray-400 mb-8">
              Tell me the role. I&apos;ll handle the resume and cover letter.
            </p>
            <Link
              href="/sign-up"
              className="inline-block px-10 py-4 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-lg transition-colors"
            >
              Get Started — from $5
            </Link>
            <p className="text-gray-600 text-xs mt-5">No subscription · Delivered in 24 hrs · Money-back guarantee</p>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="bg-gray-950 border-t border-gray-800 px-4 py-8">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-600">
            <p className="font-bold text-gray-400">Hireable</p>
            <p>© {new Date().getFullYear()} Hireable. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/#pricing" className="hover:text-gray-400 transition-colors">Pricing</Link>
              <Link href="/#faq" className="hover:text-gray-400 transition-colors">FAQ</Link>
              <Link href="/sign-in" className="hover:text-gray-400 transition-colors">Sign In</Link>
            </div>
          </div>
        </footer>
      </main>
    </>
  )
}
