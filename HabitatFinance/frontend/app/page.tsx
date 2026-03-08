"use client"

import { useState } from "react"
import { TopNav } from "@/components/dashboard/top-nav"
import { FinancialPulse } from "@/components/dashboard/financial-pulse"
import { WealthAnalytics } from "@/components/dashboard/wealth-analytics"
import { MacroStressTester } from "@/components/dashboard/macro-stress-tester"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Activity, BarChart3, Zap } from "lucide-react"

export default function Dashboard() {
  const [viewMode, setViewMode] = useState<"client" | "advisor">("client")

  return (
    <div className="min-h-screen bg-background">
      <TopNav viewMode={viewMode} onViewModeChange={setViewMode} />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <Tabs defaultValue="pulse" className="w-full">
          <TabsList className="mb-8 bg-card border border-border h-12 p-1">
            <TabsTrigger 
              value="pulse" 
              className="gap-2 px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Activity className="size-4" />
              Financial Pulse
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="gap-2 px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <BarChart3 className="size-4" />
              Wealth Analytics
            </TabsTrigger>
            <TabsTrigger 
              value="stress-test" 
              className="gap-2 px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Zap className="size-4" />
              Macro Stress-Tester
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pulse">
            <FinancialPulse />
          </TabsContent>

          <TabsContent value="analytics">
            <WealthAnalytics />
          </TabsContent>

          <TabsContent value="stress-test">
            <MacroStressTester />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
