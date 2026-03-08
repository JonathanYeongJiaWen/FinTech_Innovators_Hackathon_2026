"use client"

import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"
import { Leaf, Moon, Sun } from "lucide-react"

interface TopNavProps {
  viewMode: "client" | "advisor"
  onViewModeChange: (mode: "client" | "advisor") => void
}

export function TopNav({ viewMode, onViewModeChange }: TopNavProps) {
  const { theme, setTheme } = useTheme()

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center size-9 rounded-lg bg-primary/10 border border-primary/20">
              <Leaf className="size-5 text-primary" />
            </div>
            <span className="text-xl font-semibold tracking-tight text-foreground">
              Habitat
            </span>
          </div>

{/* View Toggle, Theme & Avatar */}
            <div className="flex items-center gap-4">
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="size-9 rounded-full"
              >
                <Sun className="size-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute size-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>

              {/* View Mode Toggle */}
            <div className="flex items-center gap-3 bg-muted/50 rounded-full px-4 py-2 border border-border">
              <span className={`text-sm transition-colors ${viewMode === "client" ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                Client View
              </span>
              <Switch
                checked={viewMode === "advisor"}
                onCheckedChange={(checked) => onViewModeChange(checked ? "advisor" : "client")}
                className="data-[state=checked]:bg-accent"
              />
              <span className={`text-sm transition-colors ${viewMode === "advisor" ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                Advisor View
              </span>
            </div>

            {/* User Avatar */}
            <Avatar className="size-9 border-2 border-primary/30">
              <AvatarImage src="https://api.dicebear.com/7.x/lorelei/svg?seed=habitat" alt="User" />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                JD
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  )
}
