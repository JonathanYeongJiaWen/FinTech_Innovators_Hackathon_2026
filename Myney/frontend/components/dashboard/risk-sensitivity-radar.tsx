"use client"

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from "recharts"

// Aggregated Portfolio Risk Data
const AGGREGATED_RISK_DATA = [
  { driver: "Tech Sector", current: 88, optimized: 45 },
  { driver: "Macro Policy", current: 52, optimized: 58 },
  { driver: "Digital Sentiment", current: 92, optimized: 30 },
  { driver: "Interest Rates", current: 25, optimized: 45 },
  { driver: "Market Volatility", current: 78, optimized: 40 },
]

interface RiskSensitivityRadarProps {
  isOptimized?: boolean
  targetAsset?: string // New dynamic prop
}

export function RiskSensitivityRadar({ 
  isOptimized = false, 
  targetAsset = "Diversified Assets" 
}: RiskSensitivityRadarProps) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="flex-1 bg-card border border-border rounded-xl p-4">
        <div className="h-[480px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={AGGREGATED_RISK_DATA} outerRadius="75%" margin={{ top: 24, right: 30, bottom: 24, left: 30 }}>
              <PolarGrid stroke="#CBD5E1" strokeWidth={1.5} />
              <PolarAngleAxis dataKey="driver" tick={{ fill: "#1A1A1B", fontSize: 12, fontWeight: 600 }} />

              <Radar
                name="Current Risk"
                dataKey="current"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.18}
                strokeWidth={3}
                dot={{ r: 4, fill: "#ef4444", strokeWidth: 0 }}
              />

              {isOptimized && (
                <Radar
                  name="Optimized Risk"
                  dataKey="optimized"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.12}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }}
                />
              )}
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="w-full space-y-4 rounded-xl border border-border bg-card p-5 lg:w-[320px]">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Risk Sensitivity Analysis</h3>

        <div className="space-y-4">
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

          {isOptimized && (
            <div className="space-y-2 pt-2 border-t border-border animate-in fade-in slide-in-from-top-2 duration-700">
              <p className="text-[10px] font-bold text-emerald-500 uppercase flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Optimization Correction
              </p>
              <p className="text-xs leading-relaxed text-foreground font-medium">
                Our algorithm reduced Tech/Digital exposure by 42% by reallocating toward 
                <span className="text-emerald-600 font-bold"> {targetAsset}</span>, 
                effectively neutralizing the "stretch" effect.
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
            
          </div>
        </div>
      </div>
    </div>
  )
}