"use client"

import { Download, Printer } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { reportFileName, reportsToCsv } from "@/features/reports/lib/report-csv"
import type { ReportsData } from "@/types"

/**
 * Export the Reports page: a CSV download of every figure on it, or the
 * browser's print dialog — where "Save as PDF" gives a PDF. The print layout
 * itself is CSS (`print:` classes and app/globals.css), so what prints is
 * exactly what the page shows.
 */
export function ReportExport({ data }: { data: ReportsData }) {
  function downloadCsv() {
    const now = new Date()
    const blob = new Blob([reportsToCsv(data, now)], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = reportFileName(now)
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    toast.success("Report downloaded")
  }

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <Button
        variant="outline"
        onClick={downloadCsv}
        className="h-9 rounded-full border-brand-line px-4"
      >
        <Download aria-hidden />
        Download CSV
      </Button>
      <Button onClick={() => window.print()} className="h-9 rounded-full px-4">
        <Printer aria-hidden />
        Print / Save as PDF
      </Button>
    </div>
  )
}
