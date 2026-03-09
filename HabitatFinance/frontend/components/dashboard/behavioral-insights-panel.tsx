"use client"

import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { BehavioralRadarChart } from "@/components/dashboard/behavioral-radar-chart"
import { CostOfBehaviorCard } from "@/components/dashboard/cost-of-behavior-card"
import { AlertTriangle } from "lucide-react"

interface BehavioralProfile {
  lossAversion: number
  overconfidence: number
  herdMentality: number
  dispositionEffect: number
}

type AlphaDirection = "MISSED_GAINS" | "PREVENTED_LOSSES" | "NEUTRAL"

interface CostOfBehavior {
  actualPortfolioValue: number
  ghostPortfolioValue: number
  behavioralAlpha: number
  alphaDirection: AlphaDirection
}

interface BehavioralInsightsPayload {
  behavioralProfile: BehavioralProfile
  costOfBehavior: CostOfBehavior
}

interface BehavioralInsightsPanelProps {
  clientId: string
}

const API_BASE = "http://127.0.0.1:8000"

/**
 * Wrapper component that fetches and displays both the Behavioral Health
 * Radar and Cost-of-Behavior card side-by-side.  Designed to sit inside
 * the advisor Sheet slide-out.
 */
export function BehavioralInsightsPanel({
  clientId,
}: BehavioralInsightsPanelProps) {
  const [data, setData] = useState<BehavioralInsightsPayload | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const fetchInsights = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch(
          `${API_BASE}/api/v1/advisor/clients/${encodeURIComponent(clientId)}/behavioral-insights`
        )
        if (!res.ok) throw new Error("Failed to fetch behavioral insights")
        const json: BehavioralInsightsPayload = await res.json()
        if (!cancelled) setData(json)
      } catch {
        if (!cancelled) setError("Behavioral insights unavailable.")
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    fetchInsights()
    return () => {
      cancelled = true
    }
  }, [clientId])

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-[340px] w-full rounded-xl" />
        <Skeleton className="h-[340px] w-full rounded-xl" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
        <AlertTriangle className="size-4 shrink-0" />
        {error ?? "No behavioral data available for this client."}
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <BehavioralRadarChart profile={data.behavioralProfile} />
      <CostOfBehaviorCard
        data={{
          ...data.costOfBehavior,
          explanation:
            "By selling tech assets during last month's dip instead of holding, the client missed a 14% recovery.",
          actualReturnPct: 2.1,
          baselineReturnPct: 5.4,
        }}
      />
    </div>
  )
}
