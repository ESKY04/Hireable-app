"use client"

import { useState } from "react"

type Props = {
  content: string
  filename: string
  label?: string
}

export function DownloadPDF({ content, filename, label = "Download PDF" }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    setLoading(true)
    try {
      const { jsPDF } = await import("jspdf")
      const doc = new jsPDF({ unit: "mm", format: "a4" })
      const margin = 15
      const pageWidth = doc.internal.pageSize.getWidth() - margin * 2
      const lineHeight = 7
      let y = margin

      const lines = doc.splitTextToSize(content, pageWidth)
      for (const line of lines) {
        if (y + lineHeight > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage()
          y = margin
        }
        doc.setFontSize(11)
        doc.text(line, margin, y)
        y += lineHeight
      }

      doc.save(filename)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors"
    >
      {loading ? "Generating..." : label}
    </button>
  )
}
