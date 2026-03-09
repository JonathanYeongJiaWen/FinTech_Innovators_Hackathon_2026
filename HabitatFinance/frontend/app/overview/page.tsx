"use client"

import { TopNav } from "@/components/dashboard/top-nav"
import { FinancialPulse } from "@/components/dashboard/financial-pulse"
import { AdvisorDashboard } from "@/components/dashboard/advisor-dashboard"
import { LifeMilestones } from "@/components/dashboard/life-milestones"
import { DisciplineChart } from "@/components/dashboard/discipline-chart"
import { CoachingNudgeCard } from "@/components/dashboard/coaching-nudge-card"
import { ResilienceBreakdown, MOCK_RESILIENCE_DATA } from "@/components/dashboard/resilience-breakdown"
import { useViewMode } from "@/lib/view-mode-context"

export default function Page() {
  const { viewMode } = useViewMode()

  return (
    <div className="min-h-screen bg-background">
      <TopNav />

      <main className="mx-auto w-full max-w-7xl px-6 py-10 space-y-10">
        {viewMode === "client" ? (
          <>
            <FinancialPulse />
            <LifeMilestones />
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <DisciplineChart />
              </div>
              <CoachingNudgeCard />
            </div>
            <ResilienceBreakdown
              radarData={MOCK_RESILIENCE_DATA}
              aiInsightText="Your behavioral resilience score is strong. You demonstrate above-average market courage and a clear long-term strategy. Consider improving portfolio diversification to reduce concentration risk."
              isLoadingInsight={false}
            />
          </>
        ) : (
          <AdvisorDashboard />
        )}
      </main>
    </div>
  )
}