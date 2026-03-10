"use client"

import { useMilestoneStore } from "@/lib/milestone-store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Home,
  Briefcase,
  HeartPulse,
  GraduationCap,
  Palmtree,
  Target,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react"

const ICON_MAP: Record<string, { icon: typeof Target; color: string; bg: string }> = {
  "Buying Property (HDB)": { icon: Home, color: "text-blue-500", bg: "bg-blue-500/10" },
  "Job Loss (Emergency Fund)": { icon: Briefcase, color: "text-amber-500", bg: "bg-amber-500/10" },
  "Medical Emergency": { icon: HeartPulse, color: "text-red-500", bg: "bg-red-500/10" },
  "Child Education": { icon: GraduationCap, color: "text-violet-500", bg: "bg-violet-500/10" },
  "Early Retirement": { icon: Palmtree, color: "text-emerald-500", bg: "bg-emerald-500/10" },
}

export function MilestoneSummary() {
  const scenarios = useMilestoneStore((s) => s.scenarios)

  if (scenarios.length === 0) return null

  const atRisk = scenarios.filter((s) => s.status !== "Healthy").length

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Target className="size-4 text-[#108548]" />
          Active Life Milestones
          <span className="ml-auto text-xs font-normal">
            {atRisk > 0 ? (
              <span className="text-red-500 font-semibold">{atRisk} at risk</span>
            ) : (
              <span className="text-[#108548] font-semibold">All on track</span>
            )}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-2">
          {scenarios.map((s, i) => {
            const entry = ICON_MAP[s.label]
            const Icon = entry?.icon ?? Target
            const isHealthy = s.status === "Healthy"

            return (
              <div
                key={i}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs ${
                  isHealthy
                    ? "border-[#108548]/20 bg-[#108548]/5"
                    : "border-red-500/20 bg-red-500/5"
                }`}
              >
                <Icon className={`size-3.5 ${entry?.color ?? "text-muted-foreground"}`} />
                <span className="font-medium">{s.label}</span>
                {isHealthy ? (
                  <CheckCircle2 className="size-3 text-[#108548]" />
                ) : (
                  <AlertTriangle className="size-3 text-red-500" />
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
