import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://hireable.work"

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Hireable – Professional Resume & Cover Letter Writing Service",
    template: "%s | Hireable",
  },
  description:
    "Get a professionally written, job-tailored resume and cover letter delivered to your inbox within 24 hours. Starting at $5. No subscription.",
  keywords: ["resume writing", "cover letter", "job application", "resume service", "career"],
  authors: [{ name: "Hireable" }],
  openGraph: {
    type: "website",
    url: appUrl,
    siteName: "Hireable",
    title: "Hireable – Resume & Cover Letter Writing",
    description:
      "A real person rewrites your resume and cover letter for your target job. Delivered within 24 hours. Starting at $5.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hireable – Resume & Cover Letter Writing",
    description:
      "A real person rewrites your resume and cover letter for your target job. Delivered within 24 hours. Starting at $5.",
  },
  icons: {
    icon: "/favicon.ico",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          {process.env.NEXT_PUBLIC_ANALYTICS_ID && (
            <>
              {/* Analytics placeholder — replace with actual snippet */}
              {/* <script async src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_ANALYTICS_ID}`} /> */}
            </>
          )}
        </head>
        <body className={inter.className}>{children}</body>
      </html>
    </ClerkProvider>
  )
}
