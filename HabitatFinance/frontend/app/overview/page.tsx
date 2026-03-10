"use client"

import { TopNav } from "@/components/dashboard/top-nav"
import { FinancialPulse } from "@/components/dashboard/financial-pulse"
import { AdvisorDashboard } from "@/components/dashboard/advisor-dashboard"
import { useViewMode } from "@/lib/view-mode-context"

export default function Page() {
  const { viewMode } = useViewMode()

  return (
    <div className="min-h-screen bg-background">
      <TopNav />

      <main className="mx-auto w-full max-w-7xl px-6 py-10">
        {viewMode === "client" ? (
          /* ✅ ONLY render FinancialPulse here. It handles its own internal layout. */
          <FinancialPulse />
        ) : (
          <AdvisorDashboard />
        )}
      </main>
    </div>
  )
}