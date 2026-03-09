"use client"

import { TopNav } from "@/components/dashboard/top-nav"
import { MacroStressTester } from "@/components/dashboard/macro-stress-tester"
import { useState } from "react"

export default function Page() {
  const [viewMode, setViewMode] = useState<"client" | "advisor">("client")

  return (
    <div className="min-h-screen bg-background">
      <TopNav viewMode={viewMode} onViewModeChange={setViewMode} />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <MacroStressTester />
      </main>
    </div>
  )
}