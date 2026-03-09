"use client"

import { ResponsiveRadar } from "@nivo/radar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BrainCircuit } from "lucide-react"

interface BehavioralProfile {
  lossAversion: number
  overconfidence: number
  herdMentality: number
  dispositionEffect: number
}

interface BehavioralRadarChartProps {
  profile: BehavioralProfile
}

const BIAS_LABELS: Record<keyof BehavioralProfile, string> = {
  lossAversion: "Loss Aversion",
  overconfidence: "Overconfidence",
  herdMentality: "Herd Mentality",
  dispositionEffect: "Disposition Effect",
}

export function BehavioralRadarChart({ profile }: BehavioralRadarChartProps) {
  const data = (Object.keys(BIAS_LABELS) as (keyof BehavioralProfile)[]).map(
    (key) => ({
      bias: BIAS_LABELS[key],
      score: profile[key],
    })
  )

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <BrainCircuit className="size-4 text-emerald-500" />
          Behavioral Health Radar
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[260px] w-full">
          <ResponsiveRadar
            data={data}
            keys={["score"]}
            indexBy="bias"
            maxValue={100}
            margin={{ top: 32, right: 60, bottom: 32, left: 60 }}
            curve="linearClosed"
            borderWidth={2}
            borderColor="#10b981"
            gridLevels={4}
            gridShape="circular"
            gridLabelOffset={14}
            enableDots={true}
            dotSize={6}
            dotColor="#10b981"
            dotBorderWidth={0}
            colors={["rgba(16, 185, 129, 0.20)"]}
            fillOpacity={1}
            animate={true}
            theme={{
              text: {
                fontSize: 11,
                fill: "hsl(var(--muted-foreground))",
                fontWeight: 600,
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
                  borderRadius: 8,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  padding: "8px 12px",
                  border: "1px solid hsl(var(--border))",
                },
              },
            }}
          />
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground text-center italic">
          Higher scores indicate stronger bias presence. Aim for a smaller, balanced shape.
        </p>
      </CardContent>
    </Card>
  )
}
