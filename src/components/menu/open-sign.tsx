"use client"

import { cn } from "@/lib/utils"
import type { Store } from "@/lib/menu/types"
import { describeNextOpening, formatHour } from "@/lib/store-hours"
import { useStoreStatus } from "@/hooks/use-store-status"

/** The neon sign in the window: lit while the store is open. */
export function OpenSign({ store }: { store: Store }) {
  const status = useStoreStatus(store)

  // Until the browser knows the time, keep the space without guessing.
  if (!status) return <div aria-hidden className="h-12 w-24" />

  const detail = status.isOpen
    ? `até ${formatHour(status.closesAt)}`
    : (describeNextOpening(status) ?? "sem previsão")

  return (
    <div role="status" className="flex shrink-0 flex-col items-end gap-1 text-right">
      <span
        className={cn(
          "font-display text-2xl leading-none",
          status.isOpen ? "neon-on" : "text-neon-off",
        )}
      >
        {status.isOpen ? "Aberto" : "Fechado"}
      </span>
      <span className="text-sm text-muted-foreground">{detail}</span>
    </div>
  )
}
