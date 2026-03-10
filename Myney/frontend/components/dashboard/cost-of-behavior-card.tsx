"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { TrendingDown, TrendingUp, Minus } from "lucide-react"

type AlphaDirection = "MISSED_GAINS" | "PREVENTED_LOSSES" | "NEUTRAL"

interface CostOfBehaviorData {
  actualPortfolioValue: number
  ghostPortfolioValue: number
  behavioralAlpha: number
  alphaDirection: AlphaDirection
  /** Plain-English explanation of the largest behavioral impact. */
  explanation?: string
  /** Actual annualized or period return, e.g. 2.1 for +2.1%. */
  actualReturnPct?: number
  /** Buy-and-hold baseline return, e.g. 5.4 for +5.4%. */
  baselineReturnPct?: number
}

interface CostOfBehaviorCardProps {
  data: CostOfBehaviorData
}

function formatDollar(value: number): string {
  const abs = Math.abs(value)
  const formatted = abs >= 1_000_000
    ? `$${(abs / 1_000_000).toFixed(1)}M`
    : abs >= 1_000
      ? `$${(abs / 1_000).toFixed(1)}K`
      : `$${abs.toLocaleString()}`
  return value < 0 ? `-${formatted}` : `+${formatted}`
}

export function CostOfBehaviorCard({ data }: CostOfBehaviorCardProps) {
  const {
    behavioralAlpha,
    alphaDirection,
    explanation,
    actualReturnPct,
    baselineReturnPct,
  } = data

  const isNegative = alphaDirection === "MISSED_GAINS"
  const isPositive = alphaDirection === "PREVENTED_LOSSES"

  const alphaColor = isNegative
    ? "text-rose-500"
    : isPositive
      ? "text-emerald-500"
      : "text-muted-foreground"

  const AlphaIcon = isNegative
    ? TrendingDown
    : isPositive
      ? TrendingUp
      : Minus

  const directionLabel = isNegative
    ? "Missed Gains"
    : isPositive
      ? "Prevented Losses"
      : "Neutral"

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <AlphaIcon className={`size-4 ${alphaColor}`} />
          Cost of Behavior
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Hero alpha stat */}
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-bold tabular-nums tracking-tight ${alphaColor}`}>
            {formatDollar(behavioralAlpha)}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {directionLabel}
          </span>
        </div>

        {/* Plain-English explanation */}
        {explanation && (
          <p className="text-xs leading-relaxed text-muted-foreground">
            {explanation}
          </p>
        )}

        {/* Comparison metrics */}
        {actualReturnPct !== undefined && baselineReturnPct !== undefined && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Actual Return
              </p>
              <p
                className={`mt-1 text-lg font-bold tabular-nums ${
                  actualReturnPct >= 0 ? "text-emerald-500" : "text-rose-500"
                }`}
              >
                {actualReturnPct >= 0 ? "+" : ""}
                {actualReturnPct.toFixed(1)}%
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Buy-&amp;-Hold Baseline
              </p>
              <p
                className={`mt-1 text-lg font-bold tabular-nums ${
                  baselineReturnPct >= 0 ? "text-emerald-500" : "text-rose-500"
                }`}
              >
                {baselineReturnPct >= 0 ? "+" : ""}
                {baselineReturnPct.toFixed(1)}%
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
