/**
 * API service: Unified Wealth Wallet
 *
 * Calls GET /api/v1/wallet/{userId} on the FastAPI backend.
 * The endpoint requires a valid Bearer JWT in the Authorization header.
 */

import { API_BASE } from "@/lib/api"

// ---------------------------------------------------------------------------
// Types — mirror the backend WealthWalletItem Pydantic model
// ---------------------------------------------------------------------------
export interface WealthWalletItem {
  asset_id: string
  name: string
  ticker_or_symbol: string
  /** "Equities" | "Cash" | "Digital" | "Private" */
  asset_class: string
  quantity: number
  current_price: number
  total_value: number
  currency: string
}

export interface AggregatedWalletResponse {
  user_id: string
  total_value_usd: number
  asset_count: number
  holdings: WealthWalletItem[]
}

// ---------------------------------------------------------------------------
// Service function
// ---------------------------------------------------------------------------
export async function fetchAggregatedWallet(
  userId: string,
  token: string,
): Promise<AggregatedWalletResponse> {
  const url = `${API_BASE}/api/v1/wallet/${encodeURIComponent(userId)}`

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })

  if (res.status === 401) {
    throw new Error("Unauthorized: invalid or expired token.")
  }
  if (res.status === 404) {
    throw new Error(`No holdings found for user '${userId}'.`)
  }
  if (!res.ok) {
    throw new Error(`Wallet fetch failed (${res.status} ${res.statusText}).`)
  }

  return res.json() as Promise<AggregatedWalletResponse>
}
