"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, TrendingUp, Lightbulb, Shield, AlertTriangle } from "lucide-react"

function deriveInsights(data: {
  totalNetWorthUSD: number
  wellnessScore: number
  riskMetrics: { expectedReturn: number; volatility: number; sharpeRatio: number }
  liquidityProfile: { highLiquidityUSD: number; lowLiquidityUSD: number; liquidityWarningFlag: boolean }
}): string[] {
  const insights: string[] = []
  const { riskMetrics, liquidityProfile, wellnessScore } = data

  if (riskMetrics.sharpeRatio < 0.8) {
    insights.push(
      `Your Sharpe ratio is ${riskMetrics.sharpeRatio.toFixed(2)}, indicating below-average risk-adjusted returns. Consider rebalancing into lower-volatility assets to improve efficiency.`
    )
  } else {
    insights.push(
      `Your Sharpe ratio of ${riskMetrics.sharpeRatio.toFixed(2)} reflects strong risk-adjusted performance. Continue monitoring to maintain this balance.`
    )
  }

  if (liquidityProfile.liquidityWarningFlag) {
    insights.push(
      `Over 60% of your portfolio is in low-liquidity assets ($${liquidityProfile.lowLiquidityUSD.toLocaleString()}). Shifting a portion to high-liquidity holdings would reduce redemption risk.`
    )
  } else {
    insights.push(
      `Liquidity profile is healthy — $${liquidityProfile.highLiquidityUSD.toLocaleString()} in high-liquidity assets provides a strong buffer for unexpected needs.`
    )
  }

  if (riskMetrics.volatility > 0.15) {
    insights.push(
      `Portfolio volatility is ${(riskMetrics.volatility * 100).toFixed(1)}%. Diversifying across uncorrelated sectors could reduce this and raise your wellness score above ${wellnessScore}.`
    )
  }

  return insights
}

export function FinancialPulse() {
  const [netWorth, setNetWorth] = useState(0)
  const [wellnessScore, setWellnessScore] = useState(0)
  const [aiInsights, setAiInsights] = useState<string[]>([])
  const [isPulseLoading, setIsPulseLoading] = useState(true)

  const circumference = 2 * Math.PI * 70

  useEffect(() => {
    const fetchWellness = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/v1/wellness")
        if (!res.ok) throw new Error(`Request failed (${res.status})`)
        const data = await res.json()
        setNetWorth(data.totalNetWorthUSD)
        setWellnessScore(data.wellnessScore)
        setAiInsights(deriveInsights(data))
      } catch {
        setAiInsights(["Unable to load insights — please check that the backend is running."])
      } finally {
        setIsPulseLoading(false)
      }
    }
    fetchWellness()
  }, [])

  if (isPulseLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-card border-border overflow-hidden animate-pulse">
          <CardContent className="py-16 flex items-center justify-center">
            <p className="text-muted-foreground">Loading financial data…</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border animate-pulse">
          <CardContent className="py-16 flex items-center justify-center">
            <p className="text-muted-foreground">Loading insights…</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Hero Card - Net Worth & Wellness Score */}
      <Card className="bg-card border-border overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium text-muted-foreground flex items-center gap-2">
            <TrendingUp className="size-5 text-primary" />
            Total Net Worth
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            {/* Net Worth Display */}
            <div className="flex-1">
              <p className="text-5xl font-bold text-foreground tracking-tight">
                ${netWorth.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                <span className="text-primary font-medium">+12.4%</span> from last quarter
              </p>
            </div>

            {/* Wellness Score Circle */}
            <div className="relative flex flex-col items-center">
              <svg className="size-44 -rotate-90" viewBox="0 0 160 160">
                {/* Background circle */}
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="10"
                  className="text-muted/30"
                />
                {/* Progress circle */}
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="url(#wellnessGradient)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - (wellnessScore / 100) * circumference}
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="wellnessGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="oklch(0.72 0.19 160)" />
                    <stop offset="100%" stopColor="oklch(0.65 0.18 300)" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-foreground">{wellnessScore}</span>
                <span className="text-sm text-muted-foreground">/100</span>
              </div>
              <p className="text-sm font-medium text-primary mt-2">Wellness Score</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Proactive Insights Card */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-medium text-muted-foreground flex items-center gap-2">
            <Sparkles className="size-5 text-accent" />
            Proactive Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {aiInsights.map((insight, i) => (
            <InsightItem
              key={i}
              icon={
                i === 0 ? <Lightbulb className="size-5 text-primary" /> :
                i === 1 ? <Shield className="size-5 text-accent" /> :
                <AlertTriangle className="size-5 text-primary" />
              }
              title={
                i === 0 ? "Risk-Adjusted Performance" :
                i === 1 ? "Liquidity & Diversification" :
                "Volatility Alert"
              }
              description={insight}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

interface InsightItemProps {
  icon: React.ReactNode
  title: string
  description: string
}

function InsightItem({ icon, title, description }: InsightItemProps) {
  return (
    <div className="group p-4 rounded-xl bg-muted/30 border border-border hover:border-primary/30 transition-all duration-200">
      <div className="flex gap-4">
        <div className="flex-shrink-0 mt-0.5">
          <div className="p-2 rounded-lg bg-background/50 border border-border group-hover:border-primary/30 transition-colors">
            {icon}
          </div>
        </div>
        <div>
          <h4 className="font-semibold text-foreground mb-1">{title}</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  )
}
