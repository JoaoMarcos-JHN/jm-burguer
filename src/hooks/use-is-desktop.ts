"use client"

import { useSyncExternalStore } from "react"

// Tailwind's lg breakpoint: from here the comanda sits beside the menu.
const QUERY = "(min-width: 64rem)"

function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY)
  media.addEventListener("change", onChange)
  return () => media.removeEventListener("change", onChange)
}

/** false on the server and on phones. Used so only one comanda form exists at a time. */
export function useIsDesktop(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  )
}
