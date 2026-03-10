"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Sparkles, TrendingUp, BrainCircuit, Zap, 
  Info, AlertTriangle, ArrowRight 
} from "lucide-react"
import { LineChart, Line, ResponsiveContainer } from "recharts"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// Modular Component Imports
import { LifeMilestones } from "@/components/dashboard/life-milestones"
import { ResilienceBreakdown, MOCK_RESILIENCE_DATA } from "@/components/dashboard/resilience-breakdown"
import { DisciplineChart } from "@/components/dashboard/discipline-chart"
import { CoachingNudgeCard } from "@/components/dashboard/coaching-nudge-card"

const trendData = [{ val: 20 }, { val: 25 }, { val: 22 }, { val: 30 }, { val: 28 }, { val: 28.2 }]

export function FinancialPulse() {
  const router = useRouter()
  const [netWorth, setNetWorth] = useState(0)
  const [wellnessScore, setWellnessScore] = useState(0)
  const [isPulseLoading, setIsPulseLoading] = useState(true)
  
  const [behavioralResilience, setBehavioralResilience] = useState({
    stabilityRatio: 1.0,
    panicRisk: "Low",
    description: "You haven't made any emotional trades during the recent 5.0% tech dip."
  })
  const [synergy, setSynergy] = useState({
    correlationCoefficient: 0.99,
    equitiesWeight: 0.41,
    digitalAssetsWeight: 0.16,
    interpretation: "Highly Correlated"
  })

  const isHighRisk = synergy.correlationCoefficient > 0.7;
  const circumference = 2 * Math.PI * 70

  useEffect(() => {
    const fetchWellness = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/v1/wellness")
        if (!res.ok) throw new Error(`Request failed`)
        const data = await res.json()
        setNetWorth(data.totalNetWorthUSD || 700000)
        setWellnessScore(data.wellnessScore || 82)
        if (data.behavioralResilience) setBehavioralResilience(data.behavioralResilience)
        if (data.digitalTraditionalSynergy) setSynergy(data.digitalTraditionalSynergy)
      } catch {
        setNetWorth(700000); setWellnessScore(82)
      } finally {
        setIsPulseLoading(false)
      }
    }
    fetchWellness()
  }, [])

  if (isPulseLoading) return <div className="p-8 text-center animate-pulse">Syncing...</div>

  return (
    <div className="space-y-6">
      {/* ROW 1: THE ANCHOR (Full Width) */}
      <Card className="bg-card border-border overflow-hidden shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <TrendingUp className="size-5 text-[#108548]" />
            Total Net Worth
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2">
              <p className="text-6xl font-black tracking-tighter">${netWorth.toLocaleString()}</p>
              <div className="flex items-center gap-3">
                <div className="h-8 w-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <Line type="monotone" dataKey="val" stroke="#108548" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs font-bold text-[#108548]">+12.4% <span className="text-muted-foreground font-normal">vs last quarter</span></p>
              </div>
            </div>
            <div className="relative flex flex-col items-center">
              <svg className="size-40 -rotate-90" viewBox="0 0 160 160">
                <circle cx="80" cy="80" r="70" fill="none" stroke="currentColor" strokeWidth="10" className="text-muted/10" />
                <circle cx="80" cy="80" r="70" fill="none" stroke="#108548" strokeWidth="12" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference - (wellnessScore / 100) * circumference} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black">{wellnessScore}</span>
                <span className="text-[10px] text-muted-foreground uppercase font-black">Wellness</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ROW 2: RISK & ACTION (50/50 Split) */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cross-Asset Synergy */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold uppercase tracking-widest text-destructive flex items-center gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-5" /> 
              Cross-Asset Synergy
            </div>
            
            {/* Tooltip added beside the title */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="size-3.5 text-muted-foreground cursor-help hover:text-foreground transition-colors" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[250px] text-[11px] leading-relaxed p-3">
                  <p className="font-bold mb-1 uppercase tracking-tighter text-[10px]">What is this?</p>
                  Measures how your Traditional (Stocks/Bonds) and Digital (Crypto) assets move together. 
                  A high +0.99 correlation means your portfolio is **highly vulnerable** to a broad market crash.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex justify-between items-end pt-2">
            <div>
              <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Correlation</p>
              <p className="text-5xl font-black text-destructive">+0.99</p>
            </div>
            <div className="px-3 py-1 rounded-md text-[10px] font-black uppercase bg-destructive/10 text-destructive border border-destructive/20">
              Highly Correlated
            </div>
          </div>

          <div className="space-y-3">
            {/* Progress Bar */}
            <div className="relative h-4 bg-muted rounded-full flex overflow-hidden border border-border">
              <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `41%` }} />
              <div className="h-full bg-[#108548] transition-all duration-1000" style={{ width: `16%` }} />
            </div>
            
            {/* Detailed Labels for "Trad" and "Digital" */}
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
              <div className="flex flex-col gap-0.5">
                <span className="text-foreground">41% Traditional</span>
                <span className="text-[9px] text-muted-foreground font-medium lowercase">Stocks, Bonds, Cash</span>
              </div>
              <div className="flex flex-col gap-0.5 text-right">
                <span className="text-foreground">16% Digital</span>
                <span className="text-[9px] text-muted-foreground font-medium lowercase">Crypto, NFTs, DeFi</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

        {/* Actionable Recommendations */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2"><CardTitle className="text-base font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Sparkles className="size-5" /> Recommendations</CardTitle></CardHeader>
          <CardContent>
            <InsightAction icon={<Zap className="size-5 text-amber-500" />} title="Volatility Alert" desc="Tech concentration is high (42%). Stress-test against a sector crash." actionLabel="Run Stress Test" onClick={() => router.push("/stresstest")} />
          </CardContent>
        </Card>
      </div>

      {/* ROW 3: Full Width - Life Milestones */}
      <LifeMilestones />

      {/* ROW 4: Behavioral DNA (1:2 Split) */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1 bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <BrainCircuit className="size-5" /> 
              Behavioral Resilience
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="size-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[280px] text-xs leading-relaxed">
                    This evaluates your psychological response to market volatility and tracks whether you stick to your long-term plan during dips.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-between">
              <div><p className="text-3xl font-black text-[#108548]">Low</p><p className="text-[10px] uppercase font-black">Panic Risk</p></div>
              <div className="text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <p className="text-3xl font-black text-[#108548]">{behavioralResilience.stabilityRatio.toFixed(2)}</p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="size-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-[300px] text-xs leading-relaxed">
                        {behavioralResilience.stabilityRatio === 1.0 ? (
                          <p>
                            <b>Stability Ratio (0 to 1.0):</b> A perfect 1.00 means you successfully held all positions during recent volatility with zero panic-selling.
                          </p>
                        ) : (
                          <p>
                            <b>Stability Ratio (0 to 1.0):</b> A score of {behavioralResilience.stabilityRatio.toFixed(2)} indicates some reactive trading during market stress. A score closer to 1.0 reflects higher emotional discipline.
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-[10px] uppercase font-black">Stability</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground italic">{behavioralResilience.description}</p>
          </CardContent>
        </Card>
        <div className="lg:col-span-2">
          <ResilienceBreakdown radarData={MOCK_RESILIENCE_DATA} aiInsightText="Your strategy is strong, but focus on diversification." isLoadingInsight={false} />
        </div>
      </div>

      {/* ROW 5: The Profit - REFACTORED TO 2:1 RATIO */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DisciplineChart />
        </div>
        <div className="lg:col-span-1">
          <CoachingNudgeCard />
        </div>
      </div>
    </div>
  )
}

function InsightAction({ icon, title, desc, actionLabel, onClick }: { icon: any, title: string, desc: string, actionLabel: string, onClick?: () => void }) {
  return (
    <div className="group p-4 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-all h-full flex flex-col justify-center">
      <div className="flex gap-4">
        <div className="p-2 rounded-lg bg-background border border-border h-fit shadow-sm">{icon}</div>
        <div className="flex-1">
          <h4 className="font-bold text-sm mb-1">{title}</h4>
          <p className="text-xs text-muted-foreground leading-relaxed mb-4">{desc}</p>
          <Button variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest gap-2 group-hover:border-[#108548] group-hover:text-[#108548]" onClick={onClick}>
            {actionLabel} <ArrowRight className="size-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}