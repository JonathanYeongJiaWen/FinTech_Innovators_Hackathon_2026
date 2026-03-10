/**
 * Centralised API base URL for the FastAPI backend.
 * Set NEXT_PUBLIC_API_BASE in .env.local to override the default.
 */
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000"
