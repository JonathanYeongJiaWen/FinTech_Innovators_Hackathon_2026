"use client"

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ShieldCheck, Info } from "lucide-react" // Added Info icon
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip" // Ensure correct path for your tooltip components

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
  { label: "Risk Sensitivity", score: 74 },
]

/* ── component ── */
export function ResilienceBreakdown({
  radarData,
  aiInsightText,
  isLoadingInsight,
}: ResilienceBreakdownProps) {
  return (
    <Card className="bg-card border-border h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-[#10b981]" />
            Resilience Breakdown
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="size-3.5 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[250px] text-[11px] leading-relaxed p-3">
                <p className="font-bold mb-1 uppercase tracking-tighter text-[10px]">Behavioral Analysis</p>
                This radar maps your psychological profile against market volatility. 
                Higher scores in <strong>Market Courage</strong> and <strong>Long-Term Vision</strong> indicate a lower likelihood of panic-selling during tech sector corrections.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Radar chart */}
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
              <PolarGrid stroke="#CBD5E1" strokeWidth={1.5} />
              <PolarAngleAxis
                dataKey="label"
                tick={{ fill: "#1A1A1B", fontSize: 11, fontWeight: 600 }}
              />
              <RechartsTooltip
                formatter={(value: number) => [value, "Score"]}
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #E2E8F0",
                  borderRadius: "12px",
                  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.10)",
                }}
                itemStyle={{ color: "#1A1A1B", fontWeight: 600 }}
                labelStyle={{ color: "#1A1A1B", fontWeight: 700 }}
              />
              <Radar
                name="Resilience"
                dataKey="score"
                stroke="#4A89FF"
                fill="#4A89FF"
                fillOpacity={0.3}
                strokeWidth={3}
                dot={{ r: 4, fill: "#4A89FF", strokeWidth: 0 }}
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
          <div className="rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 px-4 py-3 mt-auto">
            <p className="text-[11px] leading-relaxed text-foreground/90 italic">
              "{aiInsightText}"
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}