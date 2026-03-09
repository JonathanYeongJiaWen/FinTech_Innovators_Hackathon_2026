"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Sparkles, TrendingUp, BrainCircuit, Zap, Shield, 
  Info, AlertTriangle, ArrowRight 
} from "lucide-react"
import { LineChart, Line, ResponsiveContainer } from "recharts"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// Mock trend data for the Wellness Sparkline
const trendData = [
  { val: 20 }, { val: 25 }, { val: 22 }, { val: 30 }, { val: 28 }, { val: 28.2 }
]

export function FinancialPulse() {
  const router = useRouter()
  const [netWorth, setNetWorth] = useState(0)
  const [wellnessScore, setWellnessScore] = useState(0)
  const [isPulseLoading, setIsPulseLoading] = useState(true)
  
  const [behavioralResilience, setBehavioralResilience] = useState({
    stabilityRatio: 0,
    panicRisk: "Low",
    description: ""
  })
  const [synergy, setSynergy] = useState({
    correlationCoefficient: 0,
    equitiesWeight: 0,
    digitalAssetsWeight: 0,
    interpretation: "Diversified"
  })

  // Calculation for identifying high risk (Correlation > 0.7 is generally considered high)
  const isHighRisk = synergy.correlationCoefficient > 0.7;

  const circumference = 2 * Math.PI * 70

  useEffect(() => {
    const fetchWellness = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/v1/wellness")
        if (!res.ok) throw new Error(`Request failed`)
        const data = await res.json()
        setNetWorth(data.totalNetWorthUSD)
        setWellnessScore(data.wellnessScore)
        
        if (data.behavioralResilience) setBehavioralResilience(data.behavioralResilience)
        if (data.digitalTraditionalSynergy) setSynergy(data.digitalTraditionalSynergy)
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
            <CardTitle className="text-lg font-semibold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-5 text-[#108548]" />
                Total Net Worth
              </div>
              <span className="text-[10px] bg-[#108548]/10 text-[#108548] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">Live</span>
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

        {/* BEHAVIORAL RESILIENCE */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className={`text-lg font-semibold flex items-center gap-2 ${behavioralResilience.panicRisk === "High" ? 'text-destructive' : 'text-foreground'}`}>
                <BrainCircuit className="size-5" />
                Behavioral Resilience
              </CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="size-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[250px] text-xs leading-relaxed">
                    Overall assessment of your emotional discipline. High resilience helps protect your long-term wealth from impulsive decisions.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <p className={`text-3xl font-bold ${behavioralResilience.panicRisk === "High" ? 'text-destructive' : 'text-foreground'}`}>
                  {behavioralResilience.panicRisk}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide">Market Discipline</p>
              </div>
              <div className="text-right flex flex-col items-end gap-1">
                <div className="flex items-center gap-1.5">
                  <p className={`text-base font-bold ${behavioralResilience.panicRisk === "High" ? 'text-destructive' : 'text-[#108548]'}`}>
                    {behavioralResilience.stabilityRatio.toFixed(2)}
                  </p>
                  
                  {/* NEW: Stability Ratio Breakdown Tooltip */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="size-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-[280px] p-3 text-xs leading-relaxed space-y-2">
                        <p className="font-bold border-b border-border pb-1">Stability Ratio Breakdown</p>
                        <p>Measures how well you stick to your strategy during market volatility:</p>
                        <ul className="list-disc pl-4 space-y-1">
                          <li><b>1.0 (Perfect):</b> You held all positions during market dips. No panic selling detected.</li>
                          <li><b>0.5 (Moderate):</b> You made several reactive trades as prices dropped, increasing risk.</li>
                          <li><b>0.0 (Low):</b> High frequency of emotional selling or churning during market stress.</li>
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide">Stability Ratio</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wide">
                <span>Panic Risk</span>
                <span className={behavioralResilience.panicRisk === "High" ? 'text-destructive' : 'text-[#108548]'}>
                  {behavioralResilience.panicRisk}
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${behavioralResilience.panicRisk === "High" ? 'bg-destructive' : 'bg-[#108548]'}`}
                  style={{ 
                    width: `${behavioralResilience.stabilityRatio * 100}%` 
                  }} 
                />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {behavioralResilience.description}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* RECOMMENDATIONS */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
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
              onClick={() => router.push("/stresstest")}
            />
            <InsightAction 
              icon={<Shield className="size-5 text-blue-500" />}
              title="Liquidity Buffer"
              desc="Current high-liquidity assets provide a $340k buffer. Review allocation strategy."
              actionLabel="View Analytics"
              onClick={() => router.push("/analytics")}
            />
          </CardContent>
        </Card>

        {/* CROSS-ASSET SYNERGY */}
<Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className={`text-lg font-semibold flex items-center gap-2 ${isHighRisk ? 'text-destructive' : 'text-foreground'}`}>
                {isHighRisk && <AlertTriangle className="size-5" />}
                Cross-Asset Synergy
              </CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="size-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[250px] text-[11px] leading-relaxed">
                    This measures how your *Traditional* (Stocks/Bonds) and *Digital* (Crypto) assets move together. 
                    A low correlation means they hedge each other, protecting your wealth when one market crashes.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col justify-center h-[calc(100%-60px)]">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className={`text-xs uppercase font-bold ${isHighRisk ? 'text-destructive' : 'text-muted-foreground'}`}>Correlation</p>
                  <p className={`text-3xl font-bold tracking-tight ${isHighRisk ? 'text-destructive' : 'text-foreground'}`}>
                    {synergy.correlationCoefficient >= 0 ? '+' : ''}{synergy.correlationCoefficient.toFixed(2)}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-colors ${
                  isHighRisk ? "bg-destructive/20 text-destructive" : "bg-[#108548]/10 text-[#108548]"
                }`}>
                  {isHighRisk ? "Highly Correlated" : synergy.interpretation}
                </div>
              </div>
              
              {/* Asset Allocation Section with Tooltip & Labels */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Asset Allocation Share</p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="size-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[200px] text-[11px] leading-relaxed">
                        The percentage of your total net worth currently held in each asset class. 
                        "Traditional" covers banks and stocks; "Digital" covers crypto and NFTs.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div className="relative h-4 bg-muted rounded-full flex overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-700" 
                    style={{ width: `${synergy.equitiesWeight * 100}%` }} 
                  />
                  <div 
                    className="h-full bg-[#108548] transition-all duration-700" 
                    style={{ width: `${synergy.digitalAssetsWeight * 100}%` }} 
                  />
                </div>

                <div className="flex justify-between text-[10px] text-muted-foreground font-bold uppercase tracking-wide">
                  <div className="flex flex-col">
                    <span>{(synergy.equitiesWeight * 100).toFixed(0)}% Traditional</span>
                    <span className="text-[9px] font-normal lowercase opacity-70">Stocks, Bonds, Cash</span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span>{(synergy.digitalAssetsWeight * 100).toFixed(0)}% Digital</span>
                    <span className="text-[9px] font-normal lowercase opacity-70">Crypto, NFTs, Tokens</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function InsightAction({ icon, title, desc, actionLabel, onClick }: { 
  icon: any, title: string, desc: string, actionLabel: string, onClick?: () => void 
}) {
  return (
    <div className="group p-4 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-all">
      <div className="flex gap-4">
        <div className="p-2 rounded-lg bg-background border border-border h-fit">{icon}</div>
        <div className="flex-1">
          <h4 className="font-semibold text-sm mb-1">{title}</h4>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">{desc}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7 text-[10px] font-bold uppercase tracking-wider gap-2 group-hover:border-[#108548] group-hover:text-[#108548]"
            onClick={onClick}
          >
            {actionLabel} <ArrowRight className="size-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}