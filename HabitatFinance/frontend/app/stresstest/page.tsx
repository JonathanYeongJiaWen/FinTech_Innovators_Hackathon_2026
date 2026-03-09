"use client"

import { TopNav } from "@/components/dashboard/top-nav"
import { MacroStressTester } from "@/components/dashboard/macro-stress-tester"

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <MacroStressTester />
      </main>
    </div>
  )
}