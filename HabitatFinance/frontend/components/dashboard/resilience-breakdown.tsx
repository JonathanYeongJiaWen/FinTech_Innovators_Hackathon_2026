"use client"

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ShieldCheck } from "lucide-react"

/* ── types ── */
export interface ResilienceAxis {
  label: string
  score: number
}

export interface ResilienceBreakdownProps {
  radarData: ResilienceAxis[]
  aiInsightText: string
  isLoadingInsight: boolean
}

/* ── mock data for testing ── */
export const MOCK_RESILIENCE_DATA: ResilienceAxis[] = [
  { label: "Market Courage", score: 85 },
  { label: "Diversification Discipline", score: 60 },
  { label: "Independent Strategy", score: 90 },
  { label: "Long-Term Vision", score: 88 },
]

/* ── component ── */
export function ResilienceBreakdown({
  radarData,
  aiInsightText,
  isLoadingInsight,
}: ResilienceBreakdownProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <ShieldCheck className="size-5 text-emerald-500" />
          Resilience Breakdown
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Radar chart */}
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis
                dataKey="label"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <Radar
                name="Resilience"
                dataKey="score"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.3}
                strokeWidth={2}
                dot={{ r: 4, fill: "#10b981", strokeWidth: 0 }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* AI insight area */}
        {isLoadingInsight ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        ) : (
          <div className="rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 px-4 py-3">
            <p className="text-sm leading-relaxed text-foreground/90">
              {aiInsightText}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
