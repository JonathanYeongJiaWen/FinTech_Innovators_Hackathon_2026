interface LiquidityReadinessProps {
  goalName: string
  targetAmount: number
  liquidAssetsAvailable: number
}

export function LiquidityReadiness({
  goalName,
  targetAmount,
  liquidAssetsAvailable,
}: LiquidityReadinessProps) {
  const pct = targetAmount > 0 ? Math.min((liquidAssetsAvailable / targetAmount) * 100, 100) : 0
  const rounded = Math.round(pct)

  const barColor =
    pct >= 80
      ? "bg-emerald-500"
      : pct >= 50
        ? "bg-amber-500"
        : "bg-rose-500"

  const textColor =
    pct >= 80
      ? "text-emerald-500"
      : pct >= 50
        ? "text-amber-500"
        : "text-rose-500"

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between text-sm text-muted-foreground">
        <span>
          Liquid Cash Ready:{" "}
          <span className="font-semibold text-foreground">
            ${liquidAssetsAvailable.toLocaleString()}
          </span>{" "}
          / Target:{" "}
          <span className="font-semibold text-foreground">
            ${targetAmount.toLocaleString()}
          </span>
        </span>
        <span className={`text-xs font-bold ${textColor}`}>{rounded}%</span>
      </div>

      {/* progress track */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted/40">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${rounded}%` }}
        />
      </div>
    </div>
  )
}
