"use client"

import { useState } from "react"
import { useMilestoneStore, type ScenarioResult } from "@/lib/milestone-store"
import { LiquidityReadiness } from "@/components/dashboard/liquidity-readiness"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Home,
  Briefcase,
  HeartPulse,
  GraduationCap,
  Palmtree,
  Plus,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Target,
  X,
} from "lucide-react"

// ---- constants ------------------------------------------------------------

const SCENARIO_OPTIONS = [
  { value: "Buying Property (HDB)", type: "Goal", icon: Home, color: "text-blue-500", bg: "bg-blue-500/10" },
  { value: "Job Loss (Emergency Fund)", type: "Shock", icon: Briefcase, color: "text-amber-500", bg: "bg-amber-500/10" },
  { value: "Medical Emergency", type: "Shock", icon: HeartPulse, color: "text-red-500", bg: "bg-red-500/10" },
  { value: "Child Education", type: "Goal", icon: GraduationCap, color: "text-violet-500", bg: "bg-violet-500/10" },
  { value: "Early Retirement", type: "Goal", icon: Palmtree, color: "text-emerald-500", bg: "bg-emerald-500/10" },
] as const

function iconForLabel(label: string) {
  const match = SCENARIO_OPTIONS.find((o) => o.value === label)
  if (match) {
    const Icon = match.icon
    return <Icon className={`size-5 ${match.color}`} />
  }
  return <Target className="size-5 text-muted-foreground" />
}

function bgForLabel(label: string) {
  return SCENARIO_OPTIONS.find((o) => o.value === label)?.bg ?? "bg-muted/20"
}

// ---- component ------------------------------------------------------------

export function LifeMilestones() {
  const scenarios = useMilestoneStore((s) => s.scenarios)
  const addScenarios = useMilestoneStore((s) => s.addScenarios)
  const removeScenario = useMilestoneStore((s) => s.removeScenario)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // form state
  const [selectedScenario, setSelectedScenario] = useState("")
  const [targetAmount, setTargetAmount] = useState("")
  const [targetDate, setTargetDate] = useState("")

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedScenario || !targetAmount) return

    const option = SCENARIO_OPTIONS.find((o) => o.value === selectedScenario)
    if (!option) return

    setIsSubmitting(true)
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/wellness/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarios: [
            {
              label: selectedScenario,
              type: option.type,
              target_amount: Number(targetAmount),
              target_date: targetDate || null,
            },
          ],
          cpf_oa_balance: 45000,
          cash_reserves: 20000,
          monthly_burn_rate: 4000,
        }),
      })
      if (!res.ok) throw new Error("Request failed")
      const data: { results: ScenarioResult[] } = await res.json()
      addScenarios(data.results)
      setDialogOpen(false)
      setSelectedScenario("")
      setTargetAmount("")
      setTargetDate("")
    } catch {
      console.error("Scenarios endpoint offline")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Target className="size-5 text-[#108548]" />
            Life Milestones & Scenarios
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Plan ahead for major goals and stress-test against financial shocks.
          </p>
        </div>
        <Button
          size="sm"
          className="gap-2 h-8 text-[10px] font-bold uppercase tracking-wider"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="size-3" /> Add Scenario
        </Button>
      </div>

      {/* Scenario Cards Grid */}
      {scenarios.length === 0 ? (
        <Card className="border-dashed bg-card/50">
          <CardContent className="py-10 flex flex-col items-center justify-center text-center">
            <Target className="size-8 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">No scenarios added yet.</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Click &ldquo;Add Scenario&rdquo; to plan for a milestone or stress-test a shock.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {scenarios.map((s, i) => (
            <Card key={i} className="bg-card border-border overflow-hidden">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg border border-border ${bgForLabel(s.label)}`}>
                      {iconForLabel(s.label)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm leading-tight">{s.label}</h4>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide mt-0.5">
                        {s.type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      s.status === "Healthy"
                        ? "bg-[#108548]/10 text-[#108548]"
                        : "bg-red-500/15 text-red-500"
                    }`}
                  >
                    {s.status === "Healthy" ? (
                      <CheckCircle2 className="size-3" />
                    ) : (
                      <AlertTriangle className="size-3" />
                    )}
                    {s.status === "Healthy" ? "On Track" : "At Risk"}
                  </span>
                  <button
                    onClick={() => removeScenario(i)}
                    className="p-1 rounded-md text-muted-foreground/50 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    aria-label={`Remove ${s.label}`}
                  >
                    <X className="size-3.5" />
                  </button>
                  </div>
                </div>

                <div className="flex justify-between text-xs border-t border-border pt-2">
                  <span className="text-muted-foreground">Impact</span>
                  <span className={`font-semibold ${s.impact_amount >= 0 ? "text-[#108548]" : "text-red-500"}`}>
                    {s.impact_amount >= 0 ? "+" : ""}${Math.abs(s.impact_amount).toLocaleString()}
                    <span className="text-[10px] font-normal text-muted-foreground ml-1">
                      {s.impact_amount >= 0 ? "surplus" : "shortfall"}
                    </span>
                  </span>
                </div>

                <div className="border-t border-border pt-2">
                  <LiquidityReadiness
                    goalName={s.label}
                    targetAmount={s.target_amount}
                    liquidAssetsAvailable={s.liquid_assets_available}
                  />
                </div>

                <p className="text-[11px] text-muted-foreground leading-relaxed border-t border-border pt-2">
                  {s.recommendation}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Scenario Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Add Scenario</DialogTitle>
            <DialogDescription>
              Select a life milestone or financial shock, then enter the target amount.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Scenario Type</Label>
              <Select value={selectedScenario} onValueChange={setSelectedScenario}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a scenario..." />
                </SelectTrigger>
                <SelectContent>
                  {SCENARIO_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className="flex items-center gap-2">
                        <opt.icon className={`size-4 ${opt.color}`} />
                        {opt.value}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="scenario_amount">Target Amount ($)</Label>
              <Input
                id="scenario_amount"
                type="number"
                min={0}
                step={1000}
                placeholder="e.g. 85000"
                value={targetAmount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTargetAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scenario_date">Target Date (optional)</Label>
              <Input
                id="scenario_date"
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={targetDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTargetDate(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full gap-2" disabled={isSubmitting || !selectedScenario || !targetAmount}>
                {isSubmitting ? (
                  <><Loader2 className="size-3 animate-spin" /> Analyzing...</>
                ) : (
                  <><Plus className="size-3" /> Add & Analyze</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
