"use client"

import { useState } from "react"
import { TopNav } from "@/components/dashboard/top-nav"
import { FinancialPulse } from "@/components/dashboard/financial-pulse"

export default function Page() {
  const [viewMode, setViewMode] = useState<"client" | "advisor">("client")

  return (
    <div className="min-h-screen bg-background">
      <TopNav viewMode={viewMode} onViewModeChange={setViewMode} />

<<<<<<< HEAD
      <main className="mx-auto w-full max-w-5xl px-6 py-10">
=======
      <main className="mx-auto w-full max-w-7xl px-6 py-10">
>>>>>>> 74841c0c67f31cc4d2a430839d2128d582af275f
        <FinancialPulse />
      </main>
    </div>
  )
}