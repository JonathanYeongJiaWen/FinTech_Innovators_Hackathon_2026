"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Users,
  ShieldAlert,
} from "lucide-react"
import { BehavioralInsightsPanel } from "@/components/dashboard/behavioral-insights-panel"

interface PortfolioSummary {
  asset_class_1: string
  asset_class_1_pct: number
  asset_class_2: string
  asset_class_2_pct: number
}

interface ActiveScenario {
  label: string
  type: string
  status: string
  shortfall: number
  liquid_allocated: number
}

interface Client {
  client_id: string
  name: string
  net_worth: number
  wellness_score: number
  portfolio_summary: PortfolioSummary
  active_scenarios: ActiveScenario[]
}

interface Insight {
  primary_risk: string
  recommended_action: string
}

import { API_BASE } from "@/lib/api"

export function AdvisorDashboard() {
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [insight, setInsight] = useState<Insight | null>(null)
  const [insightLoading, setInsightLoading] = useState(false)
  const [insightError, setInsightError] = useState<string | null>(null)

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/advisor/clients`)
        if (!res.ok) throw new Error("Failed to fetch clients")
        const data: Client[] = await res.json()
        setClients(data)
      } catch {
        console.error("Could not load advisor clients")
      } finally {
        setIsLoading(false)
      }
    }
    fetchClients()
  }, [])

  const handleRowClick = useCallback(async (client: Client) => {
    setSelectedClient(client)
    setInsight(null)
    setInsightError(null)
    setInsightLoading(true)

    try {
      const res = await fetch(`${API_BASE}/api/v1/advisor/generate-insight`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portfolio_summary: client.portfolio_summary,
          wellness_score: client.wellness_score,
          active_scenarios: client.active_scenarios,
        }),
      })
      if (!res.ok) throw new Error("Insight generation failed")
      const data: Insight = await res.json()
      setInsight(data)
    } catch {
      setInsightError("AI insight unavailable. Please try again.")
    } finally {
      setInsightLoading(false)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <>
      <Card className="border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Users className="size-5 text-blue-500" />
            Advisor Book — Client Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead className="text-right">Net Worth</TableHead>
                <TableHead className="text-right">Wellness Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => {
                const isLow = client.wellness_score < 60
                return (
                  <TableRow
                    key={client.client_id}
                    className={`cursor-pointer transition-colors ${
                      isLow
                        ? "bg-rose-500/8 hover:bg-rose-500/15"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => handleRowClick(client)}
                  >
                    <TableCell className="font-medium">
                      {client.name}
                      {isLow && (
                        <Badge
                          variant="destructive"
                          className="ml-2 text-[10px] px-1.5 py-0"
                        >
                          At Risk
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      ${client.net_worth.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`font-semibold tabular-nums ${
                          isLow ? "text-rose-500" : "text-emerald-500"
                        }`}
                      >
                        {client.wellness_score}
                      </span>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <Sheet
        open={!!selectedClient}
        onOpenChange={(open) => {
          if (!open) setSelectedClient(null)
        }}
      >
        <SheetContent side="right" className="sm:max-w-2xl w-full overflow-y-auto">
          {selectedClient && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedClient.name}</SheetTitle>
                <SheetDescription>
                  {selectedClient.client_id} &middot; Net Worth: $
                  {selectedClient.net_worth.toLocaleString()}
                </SheetDescription>
              </SheetHeader>

              {/* Portfolio breakdown */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border p-3 text-center">
                  <p className="text-xs text-muted-foreground">
                    {selectedClient.portfolio_summary.asset_class_1}
                  </p>
                  <p className="text-xl font-bold tabular-nums">
                    {selectedClient.portfolio_summary.asset_class_1_pct}%
                  </p>
                </div>
                <div className="rounded-lg border border-border p-3 text-center">
                  <p className="text-xs text-muted-foreground">
                    {selectedClient.portfolio_summary.asset_class_2}
                  </p>
                  <p className="text-xl font-bold tabular-nums">
                    {selectedClient.portfolio_summary.asset_class_2_pct}%
                  </p>
                </div>
              </div>

              <div className="mt-2 text-center">
                <span className="text-xs text-muted-foreground">
                  Wellness Score:{" "}
                </span>
                <span
                  className={`text-sm font-bold ${
                    selectedClient.wellness_score < 60
                      ? "text-rose-500"
                      : "text-emerald-500"
                  }`}
                >
                  {selectedClient.wellness_score}/100
                </span>
              </div>

              {/* Client Goals & Vulnerabilities */}
              {selectedClient.active_scenarios?.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-3">
                    <ShieldAlert className="size-4 text-blue-500" />
                    Client Goals &amp; Vulnerabilities
                  </h3>
                  <div className="space-y-2">
                    {selectedClient.active_scenarios.map((scenario, idx) => {
                      const isAtRisk = scenario.status === "At Risk"
                      return (
                        <div
                          key={idx}
                          className={`rounded-lg border p-3 ${
                            isAtRisk
                              ? "border-rose-500/50 bg-rose-500/5"
                              : "border-emerald-500/50 bg-emerald-500/5"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {isAtRisk ? (
                                <AlertTriangle className="size-4 text-rose-500 shrink-0" />
                              ) : (
                                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                              )}
                              <span className="text-sm font-medium">
                                {scenario.label}
                              </span>
                            </div>
                            <Badge
                              variant={isAtRisk ? "destructive" : "outline"}
                              className={`text-[10px] px-1.5 py-0 ${
                                !isAtRisk
                                  ? "border-emerald-500/50 text-emerald-500"
                                  : ""
                              }`}
                            >
                              {scenario.status}
                            </Badge>
                          </div>
                          <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                            <div>
                              <span className="block font-medium text-foreground">
                                {scenario.type}
                              </span>
                              Type
                            </div>
                            <div>
                              <span
                                className={`block font-medium ${
                                  scenario.shortfall > 0
                                    ? "text-rose-500"
                                    : "text-foreground"
                                }`}
                              >
                                ${scenario.shortfall.toLocaleString()}
                              </span>
                              Shortfall
                            </div>
                            <div>
                              <span className="block font-medium text-foreground">
                                ${scenario.liquid_allocated.toLocaleString()}
                              </span>
                              Liquid Alloc.
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Behavioral Insights */}
              <div className="mt-8">
                <BehavioralInsightsPanel clientId={selectedClient.client_id} />
              </div>

              {/* AI Insight Section */}
              <div className="mt-8">
                <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-4">
                  <Sparkles className="size-4 text-blue-500" />
                  AI-Generated Opportunity Insight
                </h3>

                {insightLoading && (
                  <div className="space-y-3">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                )}

                {insightError && (
                  <Alert variant="destructive">
                    <AlertTriangle className="size-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{insightError}</AlertDescription>
                  </Alert>
                )}

                {insight && !insightLoading && (
                  <div className="space-y-3">
                    <Alert className="border-rose-500/30 bg-rose-500/10">
                      <AlertTriangle className="size-4 text-rose-500" />
                      <AlertTitle className="text-rose-500 font-semibold">
                        Primary Risk
                      </AlertTitle>
                      <AlertDescription className="text-rose-400/90">
                        {insight.primary_risk}
                      </AlertDescription>
                    </Alert>

                    <Alert className="border-emerald-500/30 bg-emerald-500/10">
                      <CheckCircle2 className="size-4 text-emerald-500" />
                      <AlertTitle className="text-emerald-500 font-semibold">
                        Recommended Action
                      </AlertTitle>
                      <AlertDescription className="text-emerald-400/90">
                        {insight.recommended_action}
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </div>

              <SheetFooter className="mt-8">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Push Optimization Proposal to Client
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
