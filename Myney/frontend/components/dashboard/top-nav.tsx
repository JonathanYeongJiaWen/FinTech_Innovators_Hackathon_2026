"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"
import { Wallet, Moon, Sun, User, LayoutDashboard, BarChart3, Zap } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { useViewMode } from "@/lib/view-mode-context"

export function TopNav() {
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const router = useRouter()
  const { viewMode, setViewMode } = useViewMode()

  useEffect(() => {
    if (pathname !== "/overview") {
      setViewMode("client")
    }
  }, [pathname, setViewMode])

  function setMode(next: "client" | "advisor") {
    setViewMode(next)
    if (next === "advisor") {
      router.push("/overview")
    }
  }

  // Updated names and linked to the folder structure visible in your screenshot
  const navItems = [
    { name: "Financial Overview", href: "/overview", icon: LayoutDashboard },
    { name: "Wealth Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Macro Stress-Tester", href: "/stresstest", icon: Zap },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-[#E2E8F0] bg-white">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="flex h-18 items-center justify-between">
          
          {/* Logo Section */}
          <div className="flex min-w-fit items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#4A89FF] shadow-sm">
              <Wallet className="size-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-[#1A1A1B]">Myney</span>
          </div>

          {/* Seamless Center Navigation - No Box */}
          <nav className="ml-16 hidden items-center gap-x-8 md:flex">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`relative flex items-center gap-2 rounded-md px-2 py-2.5 text-sm font-semibold transition-colors ${
                    isActive
                      ? "text-[#4A89FF]"
                      : "text-[#1A1A1B] hover:bg-blue-50 hover:text-[#4A89FF]"
                  }`}
                >
                  <item.icon className={`size-5 ${isActive ? "text-[#4A89FF]" : "text-[#1A1A1B]"}`} />
                  {item.name}
                  {/* Subtle active indicator line */}
                  {isActive && (
                    <span className="absolute -bottom-[14px] left-2 right-2 h-0.5 rounded-full bg-[#4A89FF]" />
                  )}
                </Link>
              )
            })}
          </nav>

          <div className="flex min-w-fit items-center gap-5">
            {/* Client / Advisor Segmented Switch */}
            <div className="relative flex h-10 w-44 items-center rounded-full bg-slate-100 p-1">
              <span
                className={`absolute left-1 top-1 h-8 w-[84px] rounded-full bg-white shadow-sm transition-transform ${
                  viewMode === "advisor" ? "translate-x-[84px]" : "translate-x-0"
                }`}
              />
              <button
                type="button"
                onClick={() => setMode("client")}
                className={`relative z-10 h-8 w-[84px] rounded-full text-xs font-semibold transition-colors ${
                  viewMode === "client" ? "text-[#1A1A1B]" : "text-[#64748b]"
                }`}
              >
                Client
              </button>
              <button
                type="button"
                onClick={() => setMode("advisor")}
                className={`relative z-10 h-8 w-[84px] rounded-full text-xs font-semibold transition-colors ${
                  viewMode === "advisor" ? "text-[#1A1A1B]" : "text-[#64748b]"
                }`}
              >
                Advisor
              </button>
            </div>

            {/* Account Section */}
            <div className="h-6 w-px bg-[#E2E8F0]" />
            <div className="flex items-center gap-3">
              <Button
                variant="ghost" 
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="size-9 rounded-full text-[#1A1A1B] hover:bg-blue-50 hover:text-[#4A89FF]"
              >
                <Sun className="size-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute size-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>
              <Avatar className="size-9 border border-[#E2E8F0]">
                <AvatarFallback><User className="size-4" /></AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}