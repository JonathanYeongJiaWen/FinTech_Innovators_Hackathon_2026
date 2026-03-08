"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, TrendingUp, Lightbulb, Shield } from "lucide-react"

export function FinancialPulse() {
  const wellnessScore = 82
  const circumference = 2 * Math.PI * 70

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
                $1,250,000
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
          <InsightItem
            icon={<Lightbulb className="size-5 text-primary" />}
            title="Optimize Tax Efficiency"
            description="Consider shifting 8% of your equity holdings to tax-advantaged municipal bonds. This could save approximately $4,200 in annual taxes while maintaining similar risk exposure, improving your wellness score by 3 points."
          />
          <InsightItem
            icon={<Shield className="size-5 text-accent" />}
            title="Diversification Opportunity"
            description="Your current allocation shows 68% concentration in tech equities. Redistributing 15% to international markets and defensive sectors would reduce volatility by 22% and boost your wellness score by 5 points."
          />
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
