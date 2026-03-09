"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Treemap, ResponsiveContainer, Tooltip } from "recharts"
import { PieChart, TableIcon, Sparkles, Loader2, Activity } from "lucide-react"
import { MilestoneSummary } from "@/components/dashboard/milestone-summary"
import { RiskSensitivityRadar } from "@/components/dashboard/risk-sensitivity-radar"

// ---------------------------------------------------------------------------
// Category colour palette - Cleaned and Updated
// ---------------------------------------------------------------------------
const CATEGORY_COLORS: Record<string, { base: string; shades: string[] }> = {
Equities: { 
    base: "#4277c3", 
    shades: ["#3d6ba6", "#2b4e72", "#5a8cc2", "#a7c6ed"] 
  },
  Fixed_Income: { 
    base: "#eca1ac", 
    shades: [ "#e27589", "#eca1ac", "#f9cdd4", "#b25b6e"] 
  },
  Private_Equity: { 
    base: "#47894b", 
    shades: ["#aad688", "#  #47894b", "  #47894b"] 
  },
  Digital_Assets: { 
    base: "#739bd4", 
    shades: ["#8a817c", "#463f3a", "#bcb8b1"] 
  },
}
const FALLBACK_COLOR = "#FFA500"

function displayCategory(raw: string): string {
  return raw.replace(/_/g, " ")
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface BackendAsset {
  assetId: string
  name: string
  assetClass: string
  sector: string
  currentValueUSD: number
  liquidityTier: string
}

interface PortfolioAsset extends BackendAsset {
  allocation: number
}

interface FlatNode {
  name: string
  size: number
  category: string
  fill: string
}

interface TradeRecommendation {
  asset: string
  currentWeight: number
  optimizedWeight: number
  action: string
}

// Mock expected‐returns & volatilities per asset class (for building the request)
const MOCK_PARAMS: Record<string, { ret: number; vol: number }> = {
  Equities:       { ret: 0.10, vol: 0.20 },
  Fixed_Income:   { ret: 0.035, vol: 0.02 },
  Private_Equity: { ret: 0.12, vol: 0.15 },
  Digital_Assets: { ret: 0.15, vol: 0.30 },
}

// ---------------------------------------------------------------------------
// Transform helpers
// ---------------------------------------------------------------------------
function buildTreemapData(assets: PortfolioAsset[]): FlatNode[] {
  const grouped = new Map<string, PortfolioAsset[]>()
  for (const a of assets) {
    const list = grouped.get(a.assetClass) ?? []
    list.push(a)
    grouped.set(a.assetClass, list)
  }

  const flat: FlatNode[] = []
  for (const [cls, items] of grouped) {
    const palette = CATEGORY_COLORS[cls]
    items.forEach((item, i) => {
      flat.push({
        name: item.name,
        size: item.currentValueUSD,
        category: displayCategory(cls),
        fill: palette ? palette.shades[i % palette.shades.length] : FALLBACK_COLOR,
      })
    })
  }
  return flat
}

function buildLegend(assets: PortfolioAsset[]): { color: string; label: string; value: string }[] {
  const totals = new Map<string, number>()
  for (const a of assets) {
    totals.set(a.assetClass, (totals.get(a.assetClass) ?? 0) + a.currentValueUSD)
  }
  return [...totals.entries()].map(([cls, total]) => ({
    color: CATEGORY_COLORS[cls]?.base ?? FALLBACK_COLOR,
    label: displayCategory(cls),
    value: `$${Math.round(total).toLocaleString()}`,
  }))
}

// ---------------------------------------------------------------------------
// Recharts custom content / tooltip
// ---------------------------------------------------------------------------
interface TreemapContentProps {
  x?: number
  y?: number
  width?: number
  height?: number
  name?: string
  fill?: string
}

const CustomTreemapContent = ({ x = 0, y = 0, width = 0, height = 0, name = "", fill = "" }: TreemapContentProps) => {
  const showText = width > 40 && height > 30

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill,
          stroke: "#fff",
          strokeWidth: 1,
        }}
        rx={4}
      />
      {/* Updated with foreignObject for Text Wrapping */}
      {showText && (
        <foreignObject x={x} y={y} width={width} height={height}>
          <div className="flex items-center justify-center h-full w-full p-2 overflow-hidden pointer-events-none">
            <p className="text-[10px] font-bold text-white text-center leading-tight break-words"
               style={{ textShadow: "0px 1px 2px rgba(0,0,0,0.6)" }}>
              {name}
            </p>
          </div>
        </foreignObject>
      )}
    </g>
  )
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-xl">
        <p className="font-semibold text-foreground">{data.name}</p>
        <p className="text-sm text-muted-foreground">{data.category}</p>
        <p className="text-sm font-medium text-primary mt-1">
          ${data.size.toLocaleString()}
        </p>
      </div>
    )
  }
  return null
}

const LegendItem = ({ color, label, value }: { color: string; label: string; value: string }) => (
  <div className="flex items-center gap-2">
    <div className="size-3 rounded-full" style={{ backgroundColor: color }} />
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm font-medium">{value}</span>
  </div>
)

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function WealthAnalytics() {
  const [portfolioAssets, setPortfolioAssets] = useState<PortfolioAsset[]>([])
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(true)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizedData, setOptimizedData] = useState<FlatNode[] | null>(null)
  const [tradeRecommendations, setTradeRecommendations] = useState<TradeRecommendation[]>([])

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/v1/assets")
        if (!res.ok) throw new Error(`Request failed`)
        const data: BackendAsset[] = await res.json()
        
        const totalValue = data.reduce((s, a) => s + a.currentValueUSD, 0)
        
        // 1. Process and calculate allocation
        let processed = data.map((a) => ({
          ...a,
          allocation: totalValue > 0 ? Math.round((a.currentValueUSD / totalValue) * 1000) / 10 : 0,
        }))

        // 2. STRICT DESCENDING SORT: (b.allocation - a.allocation)
        // This ensures the 42.4% Private Equity appears at the top
        processed.sort((a, b) => b.allocation - a.allocation)
        
        setPortfolioAssets(processed)
      } catch (err) {
        console.error(err)
      } finally {
        setIsAnalyticsLoading(false)
      }
    }
    fetchAssets()
  }, [])

  // -------------------------------------------------------------------------
  // Optimize handler
  // -------------------------------------------------------------------------
  const handleOptimize = async () => {
    if (portfolioAssets.length === 0) return
    setIsOptimizing(true)
    setOptimizedData(null)
    setTradeRecommendations([])

    const totalValue = portfolioAssets.reduce((s, a) => s + a.currentValueUSD, 0)
    const assetNames = portfolioAssets.map((a) => a.name)
    const currentWeights = portfolioAssets.map((a) => a.currentValueUSD / totalValue)
    const expectedReturns = portfolioAssets.map(
      (a) => MOCK_PARAMS[a.assetClass]?.ret ?? 0.08,
    )
    const vols = portfolioAssets.map(
      (a) => MOCK_PARAMS[a.assetClass]?.vol ?? 0.15,
    )

    // Simple mock covariance: corr = 0.3 off-diagonal
    const n = assetNames.length
    const covMatrix: number[][] = Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) =>
        i === j ? vols[i] ** 2 : 0.3 * vols[i] * vols[j],
      ),
    )

    try {
      const res = await fetch(
        "http://127.0.0.1:8000/api/v1/optimize-portfolio",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            asset_names: assetNames,
            current_weights: currentWeights,
            expected_returns: expectedReturns,
            covariance_matrix: covMatrix,
          }),
        },
      )
      if (!res.ok) throw new Error("Optimization failed")
      const data = await res.json()

      // Build optimised treemap nodes
      const optimisedAssets: PortfolioAsset[] = portfolioAssets.map((a) => ({
        ...a,
        currentValueUSD: Math.round(
          (data.optimizedWeights[a.name] ?? 0) * totalValue,
        ),
        allocation:
          Math.round((data.optimizedWeights[a.name] ?? 0) * 1000) / 10,
      }))

      setOptimizedData(buildTreemapData(optimisedAssets))
      setTradeRecommendations(data.recommendations ?? [])
    } catch (err) {
      console.error(err)
    } finally {
      setIsOptimizing(false)
    }
  }

  if (isAnalyticsLoading) {
    return (
      <div className="space-y-6">
        <Card className="bg-card border-border animate-pulse">
          <CardContent className="py-24 flex items-center justify-center">
            <p className="text-muted-foreground">Loading portfolio data…</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const flatData = buildTreemapData(portfolioAssets)
  const legend = buildLegend(portfolioAssets)

  return (
    <div className="space-y-6">
      <MilestoneSummary />
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-medium text-muted-foreground flex items-center gap-2">
            <PieChart className="size-5 text-primary" />
            Portfolio Allocation
          </CardTitle>
          <Button size="sm" onClick={handleOptimize} disabled={isOptimizing}>
            {isOptimizing ? (
              <Loader2 className="size-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="size-4 mr-2" />
            )}
            Auto-Optimize Portfolio
          </Button>
        </CardHeader>
        <CardContent>
          {/* Loading skeleton */}
          {isOptimizing && (
            <div className="space-y-3 mb-6">
              <Skeleton className="h-80 w-full animate-pulse rounded-lg" />
            </div>
          )}

          {/* Treemaps: side-by-side when optimised */}
          {!isOptimizing && (
            <div
              className={`grid gap-6 ${
                optimizedData ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
              }`}
            >
              {/* Current Allocation */}
              <div>
                {optimizedData && (
                  <p className="text-sm font-semibold text-muted-foreground mb-2">
                    Current Allocation
                  </p>
                )}
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <Treemap
                      data={flatData}
                      dataKey="size"
                      aspectRatio={4 / 3}
                      stroke="none"
                      content={<CustomTreemapContent />}
                    >
                      <Tooltip content={<CustomTooltip />} />
                    </Treemap>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Optimised Allocation */}
              {optimizedData && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-2">
                    Optimized Allocation
                  </p>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <Treemap
                        data={optimizedData}
                        dataKey="size"
                        aspectRatio={4 / 3}
                        stroke="none"
                        content={<CustomTreemapContent />}
                      >
                        <Tooltip content={<CustomTooltip />} />
                      </Treemap>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-6 mt-6 justify-center">
            {legend.map((item) => (
              <LegendItem key={item.label} color={item.color} label={item.label} value={item.value} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actionable Orders */}
      {tradeRecommendations.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-muted-foreground flex items-center gap-2">
              <Sparkles className="size-5 text-primary" />
              Trade Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tradeRecommendations.map((rec) => {
                const isBuy = rec.action.includes("Buy")
                const isSell = rec.action.includes("Sell")
                return (
                  <div
                    key={rec.asset}
                    className="rounded-lg border border-border p-4 space-y-2"
                  >
                    <p className="font-semibold text-sm text-foreground truncate">
                      {rec.asset}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Current {(rec.currentWeight * 100).toFixed(1)}%</span>
                      <span>→</span>
                      <span>Optimized {(rec.optimizedWeight * 100).toFixed(1)}%</span>
                    </div>
                    <p
                      className={`text-sm font-bold ${
                        isBuy
                          ? "text-emerald-500"
                          : isSell
                            ? "text-rose-500"
                            : "text-muted-foreground"
                      }`}
                    >
                      {rec.action}
                    </p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-muted-foreground flex items-center gap-2">
            <TableIcon className="size-5 text-primary" />
            Top Holdings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Value ($)</TableHead>
                <TableHead className="text-right">Allocation (%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {portfolioAssets.map((asset) => (
                <TableRow key={asset.assetId}>
                  <TableCell className="font-semibold">{asset.name}</TableCell>
                  <TableCell>
                    <span 
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                      style={{ 
                        backgroundColor: (CATEGORY_COLORS[asset.assetClass]?.base || FALLBACK_COLOR) + '20',
                        color: CATEGORY_COLORS[asset.assetClass]?.base || FALLBACK_COLOR 
                      }}
                    >
                      {displayCategory(asset.assetClass)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium">${asset.currentValueUSD.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-bold text-[#4277c3]">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full" 
                          style={{ 
                            width: `${asset.allocation}%`,
                            backgroundColor: CATEGORY_COLORS[asset.assetClass]?.base || FALLBACK_COLOR
                          }} 
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-8">{asset.allocation}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-muted-foreground flex items-center gap-2">
            <Activity className="size-5 text-primary" />
            Risk Sensitivity Radar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RiskSensitivityRadar assets={portfolioAssets} />
        </CardContent>
      </Card>
    </div>
  )
}