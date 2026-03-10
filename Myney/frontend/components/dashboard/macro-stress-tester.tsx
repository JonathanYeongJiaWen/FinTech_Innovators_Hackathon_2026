"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { TrendingDown, Percent, RefreshCw, AlertTriangle, ArrowRight, Sparkles, Info } from "lucide-react"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { MilestoneSummary } from "@/components/dashboard/milestone-summary"
import { API_BASE } from "@/lib/api"

type Scenario = "tech-crash" | "rate-hike"

const scenarios = {
  "tech-crash": {
    name: "Tech Crash",
    icon: TrendingDown,
    baseImpact: -0.25,
    wellnessImpact: -15,
    description: "Simulates a major technology sector downturn",
  },
  "rate-hike": {
    name: "Rate Hike",
    icon: Percent,
    baseImpact: -0.12,
    wellnessImpact: -8,
    description: "Simulates aggressive interest rate increases",
  },
}

const BACKEND_SCENARIO_IDS: Record<Scenario, string> = {
  "tech-crash": "TECH_CRASH",
  "rate-hike": "FED_RATE_HIKE",
}

export function MacroStressTester() {
  const [selectedScenario, setSelectedScenario] = useState<Scenario>("tech-crash")
  const [severityMultiplier, setSeverityMultiplier] = useState([1.5])
  const [isLoading, setIsLoading] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState("")
  const [simulationReasoning, setSimulationReasoning] = useState("")
  const [projectedNetWorth, setProjectedNetWorth] = useState<number | string>("")
  const [projectedWellnessFromAPI, setProjectedWellnessFromAPI] = useState<number | null>(null)

  const currentNetWorth = 1250000
  const currentWellness = 82

  const scenario = scenarios[selectedScenario]
  const impact = scenario.baseImpact * severityMultiplier[0]
  const localProjectedNetWorth = Math.round(currentNetWorth * (1 + impact))
  const localProjectedWellness = Math.max(0, Math.round(currentWellness + scenario.wellnessImpact * severityMultiplier[0]))
  const loss = currentNetWorth - localProjectedNetWorth

  const displayedNetWorth = projectedNetWorth !== "" ? Number(projectedNetWorth) : localProjectedNetWorth
  const displayedWellness = projectedWellnessFromAPI !== null ? projectedWellnessFromAPI : localProjectedWellness

  const handleSimulation = async () => {
    setIsLoading(true)
    setAiAnalysis("")
    setSimulationReasoning("")
    try {
      const res = await fetch(`${API_BASE}/api/v1/stress-test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario_id: BACKEND_SCENARIO_IDS[selectedScenario],
          severity_multiplier: severityMultiplier[0],
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.detail ?? `Request failed (${res.status})`)
      }
      const data = await res.json()
      setProjectedNetWorth(data.projectedNetWorthUSD)
      setProjectedWellnessFromAPI(data.projectedWellnessScore)
      setAiAnalysis(data.aiAnalysis)
      setSimulationReasoning(data.aiAnalysis)
    } catch (err) {
      setAiAnalysis(`Error: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <MilestoneSummary />
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Control Panel */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="size-5 text-accent" />
              Scenario Control Panel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Scenario Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Select Scenario</label>
              <div className="grid grid-cols-2 gap-3">
                {(Object.entries(scenarios) as [Scenario, typeof scenarios[Scenario]][]).map(([key, scn]) => {
                  const Icon = scn.icon
                  const isSelected = selectedScenario === key
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedScenario(key)}
                      className={`group p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "border-border bg-muted/30 hover:border-muted-foreground/30"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${isSelected ? "bg-primary/20" : "bg-muted"}`}>
                          <Icon className={`size-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <span className={`font-semibold ${isSelected ? "text-primary" : "text-foreground"}`}>
                          {scn.name}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {scn.description}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Severity Slider */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Severity Multiplier</label>
                <span className="text-lg font-bold text-primary">{severityMultiplier[0].toFixed(1)}x</span>
              </div>
              <Slider
                value={severityMultiplier}
                onValueChange={setSeverityMultiplier}
                min={1.0}
                max={2.0}
                step={0.1}
                className="[&_[data-slot=slider-range]]:bg-primary [&_[data-slot=slider-track]]:bg-muted"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1.0x (Mild)</span>
                <span>1.5x (Moderate)</span>
                <span>2.0x (Severe)</span>
              </div>
            </div>

            {/* Impact Preview */}
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="size-4 text-destructive" />
                <span className="text-sm font-medium text-destructive">Projected Impact</span>
              </div>
              <p className="text-2xl font-bold text-destructive">
                -${loss.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {(impact * 100).toFixed(1)}% portfolio loss
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Before & After Projection */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-muted-foreground flex items-center gap-2">
              <RefreshCw className="size-5 text-primary" />
              Before & After Projection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Net Worth Comparison */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Net Worth</h4>
              <div className="flex items-center gap-4">
                <MetricBox
                  label="Current"
                  value={`$${currentNetWorth.toLocaleString()}`}
                  variant="default"
                />
                <ArrowRight className="size-5 text-muted-foreground flex-shrink-0" />
                {isLoading ? (
                  <div className="flex-1 p-4 rounded-xl border bg-destructive/10 border-destructive/20 animate-pulse">
                    <p className="text-xs text-muted-foreground mb-1">Projected</p>
                    <p className="text-sm font-medium text-destructive">Calculating Risk…</p>
                  </div>
                ) : (
                  <MetricBox
                    label="Projected"
                    value={`$${displayedNetWorth.toLocaleString()}`}
                    variant="destructive"
                  />
                )}
              </div>
            </div>

            {/* Wellness Score Comparison */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Wellness Score</h4>
              <div className="flex items-center gap-4">
                <MetricBox
                  label="Current"
                  value={currentWellness.toString()}
                  variant="default"
                />
                <ArrowRight className="size-5 text-muted-foreground flex-shrink-0" />
                {isLoading ? (
                  <div className="flex-1 p-4 rounded-xl border bg-destructive/10 border-destructive/20 animate-pulse">
                    <p className="text-xs text-muted-foreground mb-1">Projected</p>
                    <p className="text-sm font-medium text-destructive">Calculating Risk…</p>
                  </div>
                ) : (
                  <div className="flex-1 p-4 rounded-xl border bg-destructive/10 border-destructive/20">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs text-muted-foreground mb-1">Projected</p>
                      {simulationReasoning && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="size-3.5 text-muted-foreground hover:text-foreground cursor-help mb-1" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
                            {simulationReasoning}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <p className="text-xl font-bold text-destructive">{displayedWellness}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Visual Wellness Bars */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Current Wellness</span>
                  <span className="text-primary font-medium">{currentWellness}/100</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${currentWellness}%` }}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Projected Wellness</span>
                  {isLoading ? (
                    <span className="text-destructive font-medium animate-pulse">…/100</span>
                  ) : (
                    <span className="text-destructive font-medium">{displayedWellness}/100</span>
                  )}
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  {isLoading ? (
                    <div className="h-full w-full bg-destructive/40 rounded-full animate-pulse" />
                  ) : (
                    <div 
                      className="h-full bg-destructive rounded-full transition-all duration-500"
                      style={{ width: `${displayedWellness}%` }}
                    />
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Simulate & AI Analysis */}
      <Card className="bg-card border-border">
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-accent/10 border border-accent/20">
                <Sparkles className="size-6 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">AI-Powered Stress Test</h3>
                <p className="text-sm text-muted-foreground">
                  Run a full simulation and get AI-generated analysis of the impact
                </p>
              </div>
            </div>
            <Button
              onClick={handleSimulation}
              disabled={isLoading}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="size-4 animate-spin" />
                  Simulating...
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  Simulate {scenarios[selectedScenario].name}
                </>
              )}
            </Button>
          </div>

          {aiAnalysis && (
            <div className="mt-6 p-4 rounded-xl bg-muted/30 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="size-4 text-accent" />
                <span className="text-sm font-medium text-foreground">AI Analysis</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{aiAnalysis}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

interface MetricBoxProps {
  label: string
  value: string
  variant: "default" | "destructive"
}

function MetricBox({ label, value, variant }: MetricBoxProps) {
  return (
    <div className={`flex-1 p-4 rounded-xl border ${
      variant === "destructive" 
        ? "bg-destructive/10 border-destructive/20" 
        : "bg-muted/30 border-border"
    }`}>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-xl font-bold ${
        variant === "destructive" ? "text-destructive" : "text-foreground"
      }`}>
        {value}
      </p>
    </div>
  )
}
