"use client"

import { useState } from "react"
import { TopNav } from "@/components/dashboard/top-nav"
import { FinancialPulse } from "@/components/dashboard/financial-pulse"
import { AdvisorDashboard } from "@/components/dashboard/advisor-dashboard"
import { LifeMilestones } from "@/components/dashboard/life-milestones"

export default function Page() {
  const [viewMode, setViewMode] = useState<"client" | "advisor">("client")

  return (
    <div className="min-h-screen bg-background">
      <TopNav viewMode={viewMode} onViewModeChange={setViewMode} />

      <main className="mx-auto w-full max-w-7xl px-6 py-10 space-y-10">
        {viewMode === "client" ? (
          <>
            <FinancialPulse />
            <LifeMilestones />
          </>
        ) : (
          <AdvisorDashboard />
        )}
      </main>
    </div>
  )
}