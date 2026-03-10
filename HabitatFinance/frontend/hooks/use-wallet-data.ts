"use client"

import { useEffect, useState } from "react"
import {
  fetchAggregatedWallet,
  type AggregatedWalletResponse,
} from "@/api/wallet"

interface UseWalletDataResult {
  data: AggregatedWalletResponse | null
  isLoading: boolean
  error: string | null
  /** Manually trigger a re-fetch (e.g. on a "Refresh" button click) */
  refetch: () => void
}

/**
 * Custom React hook that fetches the live aggregated wallet for a given user.
 *
 * Retrieves the dev JWT from the NEXT_PUBLIC_DEV_TOKEN environment variable.
 * In production, swap this out for a token from your auth provider
 * (e.g. NextAuth `useSession`, Clerk `useAuth`, or Auth0 `useAuth0`).
 */
export function useWalletData(userId: string): UseWalletDataResult {
  const [data, setData] = useState<AggregatedWalletResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setIsLoading(true)
      setError(null)

      // In production, use your auth provider token here.
      const token = process.env.NEXT_PUBLIC_DEV_TOKEN ?? ""

      if (!token) {
        setError("No auth token available. Set NEXT_PUBLIC_DEV_TOKEN in .env.local.")
        setIsLoading(false)
        return
      }

      try {
        const result = await fetchAggregatedWallet(userId, token)
        if (!cancelled) setData(result)
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load wallet data.")
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [userId, tick])

  const refetch = () => setTick((t) => t + 1)

  return { data, isLoading, error, refetch }
}
