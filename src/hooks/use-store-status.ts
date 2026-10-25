"use client"

import { useMemo, useSyncExternalStore } from "react"

import type { Store } from "@/lib/menu/types"
import { getStoreStatus, type StoreStatus } from "@/lib/store-hours"

function subscribe(onChange: () => void) {
  const id = setInterval(onChange, 15_000)
  return () => clearInterval(id)
}
const currentMinute = () => Math.floor(Date.now() / 60_000)
const noMinuteOnServer = () => null

/**
 * Whether the store is open right now, refreshed every minute.
 * null during the server render: the page is cached, so "now" is only
 * known in the browser.
 */
export function useStoreStatus(
  store: Pick<Store, "hours" | "timezone" | "isTemporarilyClosed">,
): StoreStatus | null {
  const minute = useSyncExternalStore(subscribe, currentMinute, noMinuteOnServer)
  const { hours, timezone, isTemporarilyClosed } = store
  return useMemo(
    () =>
      minute === null
        ? null
        : getStoreStatus(hours, new Date(minute * 60_000), timezone, isTemporarilyClosed),
    [minute, hours, timezone, isTemporarilyClosed],
  )
}
