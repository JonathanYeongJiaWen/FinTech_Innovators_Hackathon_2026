"use client"

import { useState, useMemo } from "react"
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { TrendingUp, Info } from "lucide-react"
import {
  Tooltip as ShadTooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

/* ── mock time-series data (15 months: Jan 2025 → Mar 2026) ── */
// Story: user panic-sells during the Aug '25 drawdown, misses the recovery,
// and ends significantly below the zero-trade passive baseline.
const ALL_DATA = [
  { month: "Jan '25", actual: 215000, baseline: 215000, year: 2025, idx: 0 },
  { month: "Feb '25", actual: 224000, baseline: 217500, year: 2025, idx: 1 },
  { month: "Mar '25", actual: 229000, baseline: 219000, year: 2025, idx: 2 },
  { month: "Apr '25", actual: 235500, baseline: 221000, year: 2025, idx: 3 },
  { month: "May '25", actual: 241000, baseline: 224500, year: 2025, idx: 4 },
  { month: "Jun '25", actual: 247000, baseline: 228000, year: 2025, idx: 5 },
  { month: "Jul '25", actual: 251000, baseline: 231200, year: 2025, idx: 6 },
  { month: "Aug '25", actual: 224000, baseline: 233500, year: 2025, idx: 7 },
  { month: "Sep '25", actual: 228500, baseline: 247800, year: 2025, idx: 8 },
  { month: "Oct '25", actual: 232000, baseline: 255600, year: 2025, idx: 9 },
  { month: "Nov '25", actual: 236000, baseline: 261900, year: 2025, idx: 10 },
  { month: "Dec '25", actual: 239500, baseline: 267400, year: 2025, idx: 11 },
  { month: "Jan '26", actual: 243000, baseline: 271100, year: 2026, idx: 12 },
  { month: "Feb '26", actual: 246500, baseline: 275300, year: 2026, idx: 13 },
  { month: "Mar '26", actual: 249800, baseline: 279500, year: 2026, idx: 14 },
]

type TimeRange = "1M" | "6M" | "1Y" | "YTD" | "ALL"
const TIME_RANGES: TimeRange[] = ["1M", "6M", "1Y", "YTD", "ALL"]

function filterData(range: TimeRange) {
  switch (range) {
    case "1M":  return ALL_DATA.slice(-2)
    case "6M":  return ALL_DATA.slice(-6)
    case "1Y":  return ALL_DATA.slice(-12)
    case "YTD": return ALL_DATA.filter((d) => d.year === 2026)
    case "ALL":
    default:    return ALL_DATA
  }
}

const fmt = (v: number) =>
  v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })

/* ── custom tooltip ── */
function ChartTooltip({ active, payload, label, showBaseline }: any) {
  if (!active || !payload?.length) return null

  const actual = payload.find((p: any) => p.dataKey === "actual")?.value as number | undefined
  const baseline = payload.find((p: any) => p.dataKey === "baseline")?.value as number | undefined

  return (
    <div className="rounded-lg border bg-popover px-3.5 py-2.5 text-sm shadow-md">
      <p className="mb-1.5 font-medium text-popover-foreground">{label}</p>
      {actual !== undefined && (
        <p className="text-blue-600">Your Value: {fmt(actual)}</p>
      )}
      {showBaseline && baseline !== undefined && (
        <>
          <p className="text-slate-400">Baseline Value: {fmt(baseline)}</p>
          {actual !== undefined && (
            <p className={`mt-1 font-semibold ${actual - baseline >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
              Behavioral Alpha: {actual - baseline >= 0 ? "+" : ""}
              {fmt(actual - baseline)}
            </p>
          )}
        </>
      )}
    </div>
  )
}

/* ── main component ── */
export function DisciplineChart() {
  const [showBaseline, setShowBaseline] = useState(false)
  const [timeRange, setTimeRange] = useState<TimeRange>("1Y")

  const filteredData = useMemo(() => filterData(timeRange), [timeRange])
  const lastPoint = filteredData[filteredData.length - 1]

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-between">
          <span className="flex items-center gap-2">
            <TrendingUp className="size-5" />
            Behavioral Alpha Tracking
            <ShadTooltip>
              <TooltipTrigger asChild>
                <Info className="size-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs text-xs">
                Behavioral Alpha measures the value added or lost due to active trading decisions compared to a disciplined buy-and-hold strategy.
              </TooltipContent>
            </ShadTooltip>
          </span>

          <span className="flex items-center gap-2">
            <ShadTooltip>
              <TooltipTrigger asChild>
                <Label htmlFor="baseline-toggle" className="text-xs font-normal text-muted-foreground cursor-pointer border-b border-dashed border-muted-foreground/40">
                  Compare to Baseline
                </Label>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                Displays what your portfolio value would be if you had made zero trades since the beginning of this selected time period.
              </TooltipContent>
            </ShadTooltip>
            <Switch
              id="baseline-toggle"
              checked={showBaseline}
              onCheckedChange={setShowBaseline}
            />
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* Time range toggle */}
        <div className="flex justify-end mb-3 gap-1">
          {TIME_RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={cn(
                "px-2.5 py-1 rounded text-xs font-semibold transition-colors",
                timeRange === r
                  ? "bg-blue-600 text-white"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredData} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3CBBBA" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="#3CBBBA" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
                width={52}
              />
              <Tooltip content={<ChartTooltip showBaseline={showBaseline} />} />

              {/* Ghost Portfolio (baseline) */}
              <Line
                type="monotone"
                dataKey="baseline"
                stroke="#d0d0d0"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                opacity={showBaseline ? 1 : 0}
                style={{ transition: "opacity 500ms ease-in-out" }}
              />

              {/* Actual Portfolio with gradient fill */}
              <Area
                type="monotone"
                dataKey="actual"
                stroke="#3CBBBA"
                strokeWidth={3}
                fill="url(#actualGradient)"
                dot={false}
                activeDot={{ r: 5, strokeWidth: 2, fill: "#fff" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Summary badges */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 px-3 py-1 font-medium text-blue-700 dark:text-blue-300">
            Portfolio: {fmt(lastPoint.actual)}
          </span>
          {showBaseline && (
            <>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800/40 px-3 py-1 font-medium text-slate-600 dark:text-slate-300">
                Baseline: {fmt(lastPoint.baseline)}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 font-semibold text-emerald-700 dark:text-emerald-300">
                Net Behavioral Alpha: +{fmt(lastPoint.actual - lastPoint.baseline)}
              </span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
