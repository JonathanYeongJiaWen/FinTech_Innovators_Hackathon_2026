"use client"

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

// Treemap data structure
const treemapData = [
  {
    name: "Equities",
    children: [
      { name: "US Large Cap", size: 350000, color: "oklch(0.72 0.19 160)" },
      { name: "US Small Cap", size: 120000, color: "oklch(0.62 0.16 160)" },
      { name: "International", size: 180000, color: "oklch(0.52 0.14 160)" },
    ],
  },
  {
    name: "Fixed Income",
    children: [
      { name: "Treasury Bonds", size: 200000, color: "oklch(0.65 0.18 300)" },
      { name: "Corporate Bonds", size: 150000, color: "oklch(0.55 0.15 300)" },
      { name: "Municipal Bonds", size: 100000, color: "oklch(0.45 0.12 300)" },
    ],
  },
  {
    name: "Digital Assets",
    children: [
      { name: "Bitcoin", size: 100000, color: "oklch(0.75 0.15 80)" },
      { name: "Ethereum", size: 50000, color: "oklch(0.65 0.12 80)" },
    ],
  },
]

// Flatten data for Recharts Treemap
const flattenData = (data: typeof treemapData) => {
  return data.flatMap((category) =>
    category.children.map((child) => ({
      name: child.name,
      size: child.size,
      category: category.name,
      fill: child.color,
    }))
  )
}

const flatData = flattenData(treemapData)

// Asset table data
const assets = [
  { name: "Apple Inc. (AAPL)", category: "Equities", value: 185000, allocation: 14.8 },
  { name: "US Treasury 10Y Bond", category: "Fixed Income", value: 150000, allocation: 12.0 },
  { name: "Bitcoin", category: "Digital Assets", value: 100000, allocation: 8.0 },
  { name: "Microsoft Corp. (MSFT)", category: "Equities", value: 165000, allocation: 13.2 },
  { name: "Vanguard Total Bond ETF", category: "Fixed Income", value: 125000, allocation: 10.0 },
]

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

export function WealthAnalytics() {
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
            <LegendItem color="oklch(0.72 0.19 160)" label="Equities" value="$650,000" />
            <LegendItem color="oklch(0.65 0.18 300)" label="Fixed Income" value="$450,000" />
            <LegendItem color="oklch(0.75 0.15 80)" label="Digital Assets" value="$150,000" />
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
              {assets.map((asset) => (
                <TableRow key={asset.name} className="border-border">
                  <TableCell className="font-medium text-foreground">{asset.name}</TableCell>
                  <TableCell>
                    <CategoryBadge category={asset.category} />
                  </TableCell>
                  <TableCell className="text-right text-foreground font-medium">
                    ${asset.value.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${(asset.allocation / 15) * 100}%` }}
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
    "Digital Assets": "bg-chart-3/20 text-chart-3 border-chart-3/30",
  }

  return (
    <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${colorMap[category] || "bg-muted text-muted-foreground"}`}>
      {category}
    </span>
  )
}
