"use client"

import { ResponsiveRadar } from "@nivo/radar"
import { useMemo } from "react"

// Updated data structure to show Aggregated Portfolio Risk
const AGGREGATED_RISK_DATA = [
  {
    driver: "Tech Sector",
    current: 88,    // High dependency in current portfolio
    optimized: 45,  // Balanced dependency after optimization
  },
  {
    driver: "Macro Policy",
    current: 52,
    optimized: 58,
  },
  {
    driver: "Digital Sentiment",
    current: 92,    // High digital risk
    optimized: 30,  // Hedged through traditional assets
  },
  {
    driver: "Interest Rates",
    current: 25,
    optimized: 72,  // Increased stability through Fixed Income
  },
  {
    driver: "Market Volatility",
    current: 78,
    optimized: 40,
  },
]

export function RiskSensitivityRadar() {
  const chartKeys = ["current", "optimized"]

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Radar Chart */}
      <div className="flex-1 bg-card border border-border rounded-xl p-4">
        <div className="h-[400px] w-full">
          <ResponsiveRadar
            data={AGGREGATED_RISK_DATA}
            keys={chartKeys}
            indexBy="driver"
            maxValue={100}
            margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
            curve="linearClosed"
            borderWidth={2}
            borderColor={{ from: "color" }}
            gridLevels={5}
            gridShape="circular"
            gridLabelOffset={20}
            enableDots={true}
            dotSize={6}
            colors={["#ef4444", "#108548"]} // Red for Current, Brand Green for Optimized
            fillOpacity={0.25}
            blendMode="multiply"
            animate={true}
            theme={{
              text: { fontSize: 11, fill: "hsl(var(--muted-foreground))", fontWeight: 600 },
              grid: { line: { stroke: "hsl(var(--border))", strokeWidth: 1 } },
              tooltip: {
                container: {
                  background: "hsl(var(--background))",
                  color: "hsl(var(--foreground))",
                  fontSize: 12,
                  borderRadius: 8,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  padding: "8px 12px",
                  border: "1px solid hsl(var(--border))",
                },
              },
            }}
          />
        </div>
        <p className="mt-4 text-[11px] text-muted-foreground text-center italic">
          Comparison of weighted sensitivity to macro drivers. A smaller, balanced shape indicates higher resilience.
        </p>
      </div>

      {/* Insight Panel */}
      <div className="w-full space-y-4 rounded-xl border border-border bg-card p-5 lg:w-[320px]">
        <div>
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Risk Sensitivity Analysis</h3>
        </div>

        <div className="space-y-3 bg-muted/30 p-3 rounded-lg border border-border">
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Key Insight</p>
          <p className="text-xs leading-relaxed text-foreground">
            Your <span className="font-bold text-red-500">Current Portfolio</span> is heavily "stretched" toward Tech and Digital sentiment. 
            The <span className="font-bold text-[#108548]">Optimized Allocation</span> pulls your risk center-ward, reducing total market dependency by <span className="font-bold">34%</span>.
          </p>
        </div>

        <div className="space-y-3 border-t border-border pt-4">
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Legend</p>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <span className="font-medium">Current Portfolio</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-[#108548]" />
              <span className="font-medium">Optimized Strategy</span>
            </div>
          </div>
        </div>

        <div className="space-y-3 border-t border-border pt-4">
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Why this matters</p>
          <ul className="space-y-2 text-[11px] text-muted-foreground leading-relaxed">
            <li className="flex gap-2">
              <span className="text-[#108548]">•</span>
              <span><b>Tech Exposure:</b> Your assets move 88% in sync with the Nasdaq.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#108548]">•</span>
              <span><b>Sentiment Risk:</b> Optimization shifts weighting toward inflation-hedged assets.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}