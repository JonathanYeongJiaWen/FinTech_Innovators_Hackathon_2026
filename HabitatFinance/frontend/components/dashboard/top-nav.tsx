"use client"

import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"
import { Wallet, Moon, Sun, User, LayoutDashboard, BarChart3, Zap } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface TopNavProps {
  viewMode: "client" | "advisor"
  onViewModeChange: (mode: "client" | "advisor") => void
}

export function TopNav({ viewMode, onViewModeChange }: TopNavProps) {
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()

  // Updated names and linked to the folder structure visible in your screenshot
  const navItems = [
    { name: "Financial Overview", href: "/overview", icon: LayoutDashboard },
    { name: "Wealth Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Macro Stress-Tester", href: "/stresstest", icon: Zap },
  ]

  return (
    <header className="border-b border-border/40 bg-background/95 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo Section */}
          <div className="flex items-center gap-2.5 min-w-fit">
            <div className="flex items-center justify-center size-9 rounded-xl bg-blue-500 shadow-sm">
              <Wallet className="size-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">Myney</span>
          </div>

          {/* Seamless Center Navigation - No Box */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`relative flex items-center gap-2 py-5 text-sm font-medium transition-colors hover:text-foreground ${
                    isActive ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  <item.icon className="size-4 text-blue-500" />
                  {item.name}
                  {/* Subtle active indicator line */}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                  )}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-6 min-w-fit">
            <div className="flex items-center gap-3 border-l pl-6 border-border/40">
              <Button
                variant="ghost" 
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="size-9 rounded-full"
              >
                <Sun className="size-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute size-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>
              <Avatar className="size-9 border border-border">
                <AvatarFallback><User className="size-4" /></AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}