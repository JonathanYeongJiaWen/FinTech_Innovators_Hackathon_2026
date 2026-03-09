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
    shades: ["#c0c5ce", "#65737e"] 
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
          <div className="flex flex-wrap gap-6 mt-6 justify-center">
            {legend.map((item) => (
              <LegendItem key={item.label} color={item.color} label={item.label} value={item.value} />
            ))}
          </div>
        </CardContent>
      </Card>

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
    </div>
  )
}