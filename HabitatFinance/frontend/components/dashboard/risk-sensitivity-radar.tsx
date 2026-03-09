"use client"

import { ResponsiveRadar } from "@nivo/radar"
import { useMemo } from "react"

interface PortfolioAssetLike {
  name: string
  assetClass: string
  currentValueUSD: number
}

interface RiskSensitivityRadarProps {
  assets?: PortfolioAssetLike[]
}

const ASSET_COLORS: Record<string, string> = {
  Equities: "#4277c3",
  Digital_Assets: "#8a817c",
  Fixed_Income: "#eca1ac",
  Private_Equity: "#47894b",
}

// Hardcoded sensitivity scores for top 3 assets
const RISK_SENSITIVITY_DATA = [
  {
    driver: "Tech Sector",
    Nvidia: 95,
    BTC: 45,
    "SGX T-Bill": 12,
  },
  {
    driver: "Macro Policy",
    Nvidia: 55,
    BTC: 62,
    "SGX T-Bill": 78,
  },
  {
    driver: "Digital Sentiment",
    Nvidia: 38,
    BTC: 94,
    "SGX T-Bill": 8,
  },
  {
    driver: "Interest Rates",
    Nvidia: 42,
    BTC: 58,
    "SGX T-Bill": 88,
  },
  {
    driver: "Market Volatility",
    Nvidia: 68,
    BTC: 82,
    "SGX T-Bill": 18,
  },
]

const TOP_ASSETS_CONFIG = [
  { name: "Nvidia", assetClass: "Equities", color: "#4277c3" },
  { name: "BTC", assetClass: "Digital_Assets", color: "#8a817c" },
  { name: "SGX T-Bill", assetClass: "Fixed_Income", color: "#eca1ac" },
]

export function RiskSensitivityRadar({ assets = [] }: RiskSensitivityRadarProps) {
  const chartKeys = useMemo(() => TOP_ASSETS_CONFIG.map((a) => a.name), [])

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      {/* Radar Chart */}
      <div className="flex-1">
        <div className="h-[480px] w-full">
          <ResponsiveRadar
            data={RISK_SENSITIVITY_DATA}
            keys={chartKeys}
            indexBy="driver"
            maxValue={100}
            margin={{ top: 60, right: 80, bottom: 60, left: 80 }}
            curve="linearClosed"
            borderWidth={2}
            borderColor={{ from: "color" }}
            gridLevels={5}
            gridShape="circular"
            gridLabelOffset={20}
            enableDots={true}
            dotSize={8}
            dotColor={{ theme: "background" }}
            dotBorderWidth={2}
            dotBorderColor={{ from: "color" }}
            enableDotLabel={false}
            colors={TOP_ASSETS_CONFIG.map((a) => a.color)}
            fillOpacity={0.3}
            blendMode="normal"
            animate={true}
            motionConfig="gentle"
            theme={{
              text: {
                fontSize: 12,
                fill: "hsl(var(--foreground))",
              },
              grid: {
                line: {
                  stroke: "hsl(var(--border))",
                  strokeWidth: 1,
                },
              },
              tooltip: {
                container: {
                  background: "hsl(var(--background))",
                  color: "hsl(var(--foreground))",
                  fontSize: 12,
                  borderRadius: 4,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  padding: "8px 12px",
                  border: "1px solid hsl(var(--border))",
                },
              },
            }}
            legends={[
              {
                anchor: "top-left",
                direction: "column",
                translateX: -60,
                translateY: -40,
                itemWidth: 80,
                itemHeight: 20,
                itemTextColor: "hsl(var(--foreground))",
                symbolSize: 12,
                symbolShape: "circle",
                effects: [
                  {
                    on: "hover",
                    style: {
                      itemTextColor: "hsl(var(--primary))",
                    },
                  },
                ],
              },
            ]}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground text-center">
          The further a line stretches toward a corner, the more that asset is impacted by that specific market driver.
        </p>
      </div>

      {/* Insight Panel */}
      <div className="w-full space-y-4 rounded-lg border border-border bg-card p-4 lg:w-[280px]">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Portfolio Dependency Analysis</h3>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Key Insight</p>
          <p className="text-xs leading-relaxed text-foreground">
            <span className="font-semibold text-primary">72%</span> of your total wealth is tied to the{" "}
            <span className="font-medium">Tech Sector</span> node. While your assets look diverse, a sector downturn
            would impact both Equities and Digital holdings simultaneously.
          </p>
        </div>

        <div className="space-y-2 border-t border-border pt-3">
          <p className="text-xs font-medium text-muted-foreground">Legend</p>
          <div className="space-y-1.5 text-xs text-foreground">
            <div className="flex items-start gap-2">
              <div className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-slate-400" />
              <span>
                <span className="font-medium">Radar Points</span> show sensitivity to market drivers
              </span>
            </div>
            <div className="flex items-start gap-2">
              <div className="mt-1 h-0.5 w-4 shrink-0 bg-slate-400" />
              <span>
                <span className="font-medium">Distance from center</span> indicates impact strength
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-1.5 border-t border-border pt-3">
          <p className="text-xs font-medium text-muted-foreground">Top 3 Assets</p>
          <div className="space-y-2">
            {TOP_ASSETS_CONFIG.map((asset) => (
              <div key={asset.name} className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: asset.color }} />
                <span className="text-xs text-foreground font-medium">{asset.name}</span>
                <span className="text-[10px] text-muted-foreground">
                  ({asset.assetClass.replace(/_/g, " ")})
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2 border-t border-border pt-3">
          <p className="text-xs font-medium text-muted-foreground">Market Drivers</p>
          <ul className="space-y-1 text-xs text-foreground">
            <li className="flex items-start gap-1.5">
              <span className="text-muted-foreground">•</span>
              <span>Tech Sector performance</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-muted-foreground">•</span>
              <span>Central bank policy</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-muted-foreground">•</span>
              <span>Digital asset sentiment</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-muted-foreground">•</span>
              <span>Interest rate changes</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-muted-foreground">•</span>
              <span>Overall market volatility</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
