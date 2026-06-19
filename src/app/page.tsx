import Link from "next/link"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-50 to-white flex flex-col items-center justify-center px-4">
      <div className="max-w-3xl text-center space-y-8">
        <h1 className="text-5xl font-bold text-brand-900 tracking-tight">
          Get <span className="text-brand-500">Hired</span> Faster
        </h1>
        <p className="text-xl text-gray-600">
          AI-tailored resumes and cover letters crafted for each job in seconds.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/sign-up"
            className="px-8 py-3 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 transition-colors"
          >
            Get Started Free
          </Link>
          <Link
            href="/dashboard"
            className="px-8 py-3 border border-brand-600 text-brand-600 rounded-lg font-semibold hover:bg-brand-50 transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  )
}
