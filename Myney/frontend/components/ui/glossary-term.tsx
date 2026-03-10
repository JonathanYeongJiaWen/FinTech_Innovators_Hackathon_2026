"use client"

import * as React from "react"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"

// ---------------------------------------------------------------------------
// Glossary definitions
// ---------------------------------------------------------------------------
export const GLOSSARY: Record<string, string> = {
  "Mean-Variance Optimization": "A mathematical framework developed by Harry Markowitz that constructs the optimal portfolio by balancing expected return against portfolio variance (risk). It identifies asset weights that maximise return for a given risk level.",
  "Efficient Frontier": "The curve on a risk-return graph representing the set of portfolios that offer the maximum expected return for each level of risk. Portfolios on this frontier are 'efficient' — no better risk-return trade-off exists.",
  "Sharpe Ratio": "A risk-adjusted performance metric calculated as (Portfolio Return − Risk-Free Rate) ÷ Portfolio Volatility. A higher Sharpe Ratio indicates greater return earned per unit of risk, making it the primary optimization target.",
  "Liquidity Constraints": "Rules applied during optimisation ensuring a minimum portion of your portfolio stays readily convertible to cash, so you can meet scheduled liabilities (e.g., loan repayments, near-term goals) without forced asset sales.",
}

// ---------------------------------------------------------------------------
// GlossaryTerm component
// ---------------------------------------------------------------------------
interface GlossaryTermProps {
  /** The canonical name of the term (must match a key in GLOSSARY). */
  term: string
  /** Override the definition text if you don't want to use the default from GLOSSARY. */
  definition?: string
  /** The text to display as the trigger; defaults to `term`. */
  children?: React.ReactNode
}

export function GlossaryTerm({ term, definition, children }: GlossaryTermProps) {
  const resolvedDefinition = definition ?? GLOSSARY[term] ?? ""

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <span className="cursor-help underline decoration-dotted underline-offset-4 text-primary">
          {children ?? term}
        </span>
      </HoverCardTrigger>
      <HoverCardContent className="w-72">
        <div className="space-y-1">
          <p className="text-sm font-semibold leading-tight">{term}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{resolvedDefinition}</p>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

// ---------------------------------------------------------------------------
// renderWithGlossary — parse a plain string and highlight known terms
// ---------------------------------------------------------------------------

/** Splits `text` on any known glossary term (case-insensitive) and returns a
 *  mixed array of plain strings and <GlossaryTerm /> elements. */
export function renderWithGlossary(text: string): React.ReactNode[] {
  const terms = Object.keys(GLOSSARY)

  // Build a single alternation pattern, longest terms first (avoids partial matches)
  const sorted = [...terms].sort((a, b) => b.length - a.length)
  const escaped = sorted.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  const pattern = new RegExp(`(${escaped.join("|")})`, "gi")

  const parts = text.split(pattern)

  return parts.map((part, i) => {
    // Check if this part (case-insensitively) matches a glossary key
    const matchedKey = terms.find((k) => k.toLowerCase() === part.toLowerCase())
    if (matchedKey) {
      return (
        <GlossaryTerm key={i} term={matchedKey}>
          {part}
        </GlossaryTerm>
      )
    }
    return part
  })
}
