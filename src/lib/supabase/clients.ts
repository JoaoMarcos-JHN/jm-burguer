import "server-only"

import { createClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase/database.types"

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing ${name}. Copy .env.example to .env.local and fill it in.`)
  }
  return value
}

const noSession = { auth: { persistSession: false, autoRefreshToken: false } }

/**
 * Reads as the public would: RLS hides inactive products and every order.
 * No cookies are involved, so it is safe inside "use cache".
 */
export function createPublicClient() {
  return createClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    noSession,
  )
}

/**
 * Bypasses RLS. Only for writing orders from the server action, after every
 * price has been recalculated. Never import this from a client component.
 */
export function createServiceClient() {
  return createClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    noSession,
  )
}

/** Public URL of a file in the "product-images" bucket. */
export function productImageUrl(path: string | null): string | null {
  if (!path) return null
  return `${requireEnv("NEXT_PUBLIC_SUPABASE_URL")}/storage/v1/object/public/product-images/${path}`
}
