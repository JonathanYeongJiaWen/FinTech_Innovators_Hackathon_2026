"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Sparkles, TrendingUp, Lightbulb, Shield, 
  AlertTriangle, ArrowRight, BrainCircuit, Zap 
} from "lucide-react"
import { LineChart, Line, ResponsiveContainer } from "recharts"

// Mock trend data for the Wellness Sparkline
const trendData = [
  { val: 20 }, { val: 25 }, { val: 22 }, { val: 30 }, { val: 28 }, { val: 28.2 }
]

export function FinancialPulse() {
  const [netWorth, setNetWorth] = useState(0)
  const [wellnessScore, setWellnessScore] = useState(0)
  const [isPulseLoading, setIsPulseLoading] = useState(true)

  const circumference = 2 * Math.PI * 70

  useEffect(() => {
    const fetchWellness = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/v1/wellness")
        if (!res.ok) throw new Error(`Request failed`)
        const data = await res.json()
        setNetWorth(data.totalNetWorthUSD)
        setWellnessScore(data.wellnessScore)
      } catch {
        console.error("Backend offline")
      } finally {
        setIsPulseLoading(false)
      }
    }
    fetchWellness()
  }, [])

  if (isPulseLoading) {
    return <div className="p-8 text-center animate-pulse text-muted-foreground">Syncing Wealth Data...</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* HERO CARD: Score & Net Worth */}
        <Card className="lg:col-span-2 bg-card border-border overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-4 text-[#108548]" />
                Total Net Worth
              </div>
              <span className="text-[10px] bg-[#108548]/10 text-[#108548] px-2 py-0.5 rounded-full uppercase font-bold">Live</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div>
                <p className="text-5xl font-bold tracking-tight">${netWorth.toLocaleString()}</p>
                <div className="flex items-center gap-3 mt-4">
                  <div className="h-10 w-24">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData}>
                        <Line type="monotone" dataKey="val" stroke="#108548" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-[#108548] font-bold">+12.4%</span> vs last quarter
                  </p>
                </div>
              </div>

              {/* Wellness Score Gauge */}
              <div className="relative flex flex-col items-center">
                <svg className="size-40 -rotate-90" viewBox="0 0 160 160">
                  <circle cx="80" cy="80" r="70" fill="none" stroke="currentColor" strokeWidth="12" className="text-muted/20" />
                  <circle
                    cx="80" cy="80" r="70" fill="none"
                    stroke="#108548" strokeWidth="12" strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - (wellnessScore / 100) * circumference}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold">{wellnessScore}</span>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Wellness</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* NEW: Behavioral Resilience Index */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BrainCircuit className="size-4 text-primary" />
              Behavioral Resilience
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-2xl font-bold">High</p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Market Discipline</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-[#108548]">0.84</p>
                <p className="text-[10px] text-muted-foreground">Stability Ratio</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold uppercase">
                <span>Panic Risk</span>
                <span className="text-[#108548]">Low</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-[#108548] w-[20%]" />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              You haven't made any emotional trades during the recent 5% tech dip. Resilience is improving your Wellness Score.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ACTIONABLE INSIGHTS SECTION */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Sparkles className="size-5 text-[#108548]" />
              Actionable Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InsightAction 
              icon={<Zap className="size-5 text-amber-500" />}
              title="Volatility Alert"
              desc="Tech sector concentration is high (42%). Test your portfolio against a sector crash."
              actionLabel="Run Stress Test"
              href="/dashboard/macro-stress-tester"
            />
            <InsightAction 
              icon={<Shield className="size-5 text-blue-500" />}
              title="Liquidity Buffer"
              desc="Current high-liquidity assets provide a $340k buffer. Review allocation strategy."
              actionLabel="View Analytics"
              href="/dashboard/wealth-analytics"
            />
          </CardContent>
        </Card>

        {/* SYNERGY MAP: Traditional vs Digital */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Digital-Traditional Synergy</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col justify-center h-[calc(100%-60px)]">
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-bold">Correlation ($r$)</p>
                  <p className="text-3xl font-bold">+0.12</p>
                </div>
                <div className="px-3 py-1 bg-[#108548]/10 text-[#108548] rounded-md text-[10px] font-bold uppercase">
                  Diversified
                </div>
              </div>
              <div className="relative h-4 bg-muted rounded-full flex overflow-hidden">
                <div className="h-full bg-blue-500 w-[70%]" title="Traditional" />
                <div className="h-full bg-[#108548] w-[30%]" title="Digital" />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground font-bold uppercase">
                <span>70% Traditional</span>
                <span>30% Digital</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function InsightAction({ icon, title, desc, actionLabel, href }: { icon: any, title: string, desc: string, actionLabel: string, href: string }) {
  return (
    <div className="group p-4 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-all">
      <div className="flex gap-4">
        <div className="p-2 rounded-lg bg-background border border-border h-fit">{icon}</div>
        <div className="flex-1">
          <h4 className="font-semibold text-sm mb-1">{title}</h4>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">{desc}</p>
          <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold uppercase tracking-wider gap-2 group-hover:border-[#108548] group-hover:text-[#108548]">
            {actionLabel} <ArrowRight className="size-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}