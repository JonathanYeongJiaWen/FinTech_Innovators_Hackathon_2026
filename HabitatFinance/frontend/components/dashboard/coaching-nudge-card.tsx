"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, ShieldAlert, TrendingUp } from "lucide-react"

/* ── types ── */
export type NudgeType = "positive" | "warning" | "neutral"

export interface CoachingNudge {
  type: NudgeType
  message: string
  action?: { label: string; href?: string }
}

/* ── style map per nudge type ── */
const nudgeStyles: Record<NudgeType, { bg: string; icon: React.ReactNode; border: string }> = {
  positive: {
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-800",
    icon: <TrendingUp className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
  },
  warning: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
    icon: <ShieldAlert className="size-5 text-amber-600 dark:text-amber-400 shrink-0" />,
  },
  neutral: {
    bg: "bg-card",
    border: "border-border",
    icon: <Brain className="size-5 text-blue-600 dark:text-blue-400 shrink-0" />,
  },
}

/* ── default nudge ── */
const defaultNudge: CoachingNudge = {
  type: "positive",
  message:
    "By holding your tech assets during last month's dip, you captured an 8% recovery. " +
    "Your disciplined approach secured an extra +$4,200 compared to average panic-selling behavior.",
}

/* ── component ── */
export function CoachingNudgeCard({ nudge = defaultNudge }: { nudge?: CoachingNudge }) {
  const style = nudgeStyles[nudge.type]

  return (
    <Card className={`${style.bg} ${style.border}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Brain className="size-5 text-muted-foreground" />
          Wealth Coach Insight
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Insight message */}
        <div className="flex items-start gap-3">
          {style.icon}
          <p className="text-sm leading-relaxed text-foreground/90">{nudge.message}</p>
        </div>
      </CardContent>
    </Card>
  )
}
