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
import { Treemap, ResponsiveContainer, Tooltip } from "recharts"
import { PieChart, TableIcon } from "lucide-react"

// ---------------------------------------------------------------------------
// Category colour palette (Calm Design aesthetic)
// ---------------------------------------------------------------------------
const CATEGORY_COLORS: Record<string, { base: string; shades: string[] }> = {
  Equities:     { base: "oklch(0.72 0.19 160)", shades: ["oklch(0.72 0.19 160)", "oklch(0.62 0.16 160)", "oklch(0.52 0.14 160)"] },
  Fixed_Income: { base: "oklch(0.65 0.18 300)", shades: ["oklch(0.65 0.18 300)", "oklch(0.55 0.15 300)", "oklch(0.45 0.12 300)"] },
  Private_Equity: { base: "oklch(0.75 0.15 80)", shades: ["oklch(0.75 0.15 80)", "oklch(0.65 0.12 80)", "oklch(0.55 0.10 80)"] },
  Digital_Assets: { base: "oklch(0.70 0.14 200)", shades: ["oklch(0.70 0.14 200)", "oklch(0.60 0.12 200)", "oklch(0.50 0.10 200)"] },
}
const FALLBACK_COLOR = "oklch(0.60 0.10 250)"

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
  const showText = width > 60 && height > 40

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill,
          stroke: "oklch(0.12 0.005 260)",
          strokeWidth: 2,
        }}
        rx={4}
      />
      {showText && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-xs font-medium fill-foreground"
          style={{ fill: "oklch(0.12 0.005 260)" }}
        >
          {name}
        </text>
      )}
    </g>
  )
}

interface TooltipPayload {
  name: string
  size: number
  category: string
}

interface TreemapTooltipProps {
  active?: boolean
  payload?: { payload: TooltipPayload }[]
}

const CustomTooltip = ({ active, payload }: TreemapTooltipProps) => {
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function WealthAnalytics() {
  const [portfolioAssets, setPortfolioAssets] = useState<PortfolioAsset[]>([])
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(true)

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/v1/assets")
        if (!res.ok) throw new Error(`Request failed (${res.status})`)
        const data: BackendAsset[] = await res.json()
        const total = data.reduce((s, a) => s + a.currentValueUSD, 0)
        setPortfolioAssets(
          data.map((a) => ({
            ...a,
            allocation: total > 0 ? Math.round((a.currentValueUSD / total) * 1000) / 10 : 0,
          }))
        )
      } catch {
        // keep empty state — UI will show "No data" gracefully
      } finally {
        setIsAnalyticsLoading(false)
      }
    }
    fetchAssets()
  }, [])

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
  const maxAllocation = Math.max(...portfolioAssets.map((a) => a.allocation), 1)

  return (
    <div className="space-y-6">
      {/* Treemap Card */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-muted-foreground flex items-center gap-2">
            <PieChart className="size-5 text-primary" />
            Portfolio Allocation
          </CardTitle>
        </CardHeader>
        <CardContent>
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
          {/* Legend */}
          <div className="flex flex-wrap gap-6 mt-6 justify-center">
            {legend.map((item) => (
              <LegendItem key={item.label} color={item.color} label={item.label} value={item.value} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Assets Table */}
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
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Asset Name</TableHead>
                <TableHead className="text-muted-foreground">Category</TableHead>
                <TableHead className="text-right text-muted-foreground">Value ($)</TableHead>
                <TableHead className="text-right text-muted-foreground">Allocation (%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {portfolioAssets.map((asset) => (
                <TableRow key={asset.assetId} className="border-border">
                  <TableCell className="font-medium text-foreground">{asset.name}</TableCell>
                  <TableCell>
                    <CategoryBadge category={displayCategory(asset.assetClass)} />
                  </TableCell>
                  <TableCell className="text-right text-foreground font-medium">
                    ${asset.currentValueUSD.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${(asset.allocation / maxAllocation) * 100}%` }}
                        />
                      </div>
                      <span className="text-muted-foreground w-12 text-right">
                        {asset.allocation}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

interface LegendItemProps {
  color: string
  label: string
  value: string
}

function LegendItem({ color, label, value }: LegendItemProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="size-3 rounded-sm" style={{ backgroundColor: color }} />
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  )
}

interface CategoryBadgeProps {
  category: string
}

function CategoryBadge({ category }: CategoryBadgeProps) {
  const colorMap: Record<string, string> = {
    Equities: "bg-primary/20 text-primary border-primary/30",
    "Fixed Income": "bg-accent/20 text-accent border-accent/30",
    "Private Equity": "bg-chart-3/20 text-chart-3 border-chart-3/30",
    "Digital Assets": "bg-chart-4/20 text-chart-4 border-chart-4/30",
  }

  return (
    <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${colorMap[category] || "bg-muted text-muted-foreground"}`}>
      {category}
    </span>
  )
}
