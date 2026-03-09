"use client"

import { ResponsiveRadar } from "@nivo/radar"

// Aggregated Portfolio Risk Data
const AGGREGATED_RISK_DATA = [
  { driver: "Tech Sector", current: 88, optimized: 45 },
  { driver: "Macro Policy", current: 52, optimized: 58 },
  { driver: "Digital Sentiment", current: 92, optimized: 30 },
  { driver: "Interest Rates", current: 25, optimized: 72 },
  { driver: "Market Volatility", current: 78, optimized: 40 },
]

interface RiskSensitivityRadarProps {
  isOptimized?: boolean
}

export function RiskSensitivityRadar({ isOptimized = false }: RiskSensitivityRadarProps) {
  const chartKeys = isOptimized ? ["current", "optimized"] : ["current"]

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="flex-1 bg-card border border-border rounded-xl p-4">
        <div className="h-[480px] w-full">
          <ResponsiveRadar
            data={AGGREGATED_RISK_DATA}
            keys={chartKeys}
            indexBy="driver"
            maxValue={100}
            margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
            gridLabelOffset={28}
            curve="linearClosed"
            borderWidth={3}
            borderColor={{ from: "color" }}
            gridLevels={5}
            gridShape="circular"
            enableDots={true}
            dotSize={8}
            dotBorderWidth={2}
            dotBorderColor={{ from: "color" }}
            colors={["#ef4444", "#10b981"]}
            fillOpacity={0.15}
            blendMode="normal"
            animate={true}
            theme={{
              text: { fontSize: 12, fill: "hsl(var(--foreground))", fontWeight: 600 },
              grid: { line: { stroke: "hsl(var(--muted-foreground) / 0.3)", strokeWidth: 1.5 } },
              tooltip: {
                container: {
                  background: "hsl(var(--background))",
                  color: "hsl(var(--foreground))",
                  fontSize: 12,
                  borderRadius: 8,
                  padding: "8px 12px",
                  border: "1px solid hsl(var(--border))",
                },
              },
            }}
          />
        </div>
      </div>

      {/* Insight Panel: Problem vs. Solution Analysis */}
      <div className="w-full space-y-4 rounded-xl border border-border bg-card p-5 lg:w-[320px]">
        <div>
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Risk Sensitivity Analysis</h3>
        </div>

        {/* Dynamic Analysis Block */}
        <div className="space-y-4">
          {/* THE PROBLEM (Always visible for context) */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-red-500 uppercase flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              Initial Vulnerability
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground italic">
              Portfolio was heavily "stretched" (88%+) toward Tech and Digital Sentiment, creating a dangerous 
              single-point of failure during sector crashes.
            </p>
          </div>

          {/* THE CORRECTION (Revealed on Optimize) */}
          {isOptimized && (
            <div className="space-y-2 pt-2 border-t border-border animate-in fade-in slide-in-from-top-2 duration-700">
              <p className="text-[10px] font-bold text-emerald-500 uppercase flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Optimization Correction
              </p>
              <p className="text-xs leading-relaxed text-foreground font-medium">
                Our algorithm reduced Tech/Digital exposure by 42% by reallocating toward 
                interest-rate sensitive Fixed Income, effectively neutralizing the "stretch" effect.
              </p>
              <div className="mt-2 bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
                <p className="text-[10px] text-emerald-500 font-bold">Resilience Gain: +34.2%</p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3 border-t border-border pt-4">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Legend</p>
          <div className="space-y-2 text-[11px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <span>Current Risk</span>
              </div>
              <span className="text-red-500 font-bold">High</span>
            </div>
            {isOptimized && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Optimized Risk</span>
                </div>
                <span className="text-emerald-500 font-bold">Balanced</span>
              </div>
            )}
          </div>
        </div>

        <div className="pt-2">
           <p className="text-[9px] text-muted-foreground leading-tight">
             Optimization targets a 0.25 correlation coefficient across diverse drivers to minimize systemic impact.
           </p>
        </div>
      </div>
    </div>
  )
}