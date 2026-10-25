"use client"

import { ChevronUpIcon } from "lucide-react"

import { CheckoutForm } from "@/components/cart/checkout-form"
import { ComandaTicket } from "@/components/cart/comanda-ticket"
import { OrderSent } from "@/components/cart/order-sent"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer"
import { useIsDesktop } from "@/hooks/use-is-desktop"
import type { Store } from "@/lib/menu/types"
import { formatBRL } from "@/lib/money"
import { cartCount, cartSubtotal, useCartStore } from "@/stores/cart-store"
import { useCheckoutStore } from "@/stores/checkout-store"

/** Whichever step the order is in: the comanda, the delivery form, or the sent ticket. */
function ComandaSteps({ store }: { store: Store }) {
  const step = useCheckoutStore((state) => state.step)
  const sentOrder = useCheckoutStore((state) => state.sentOrder)
  const hasItems = useCartStore((state) => state.items.length > 0)

  if (step === "sent" && sentOrder) return <OrderSent order={sentOrder} />
  if (step === "checkout" && hasItems) return <CheckoutForm store={store} />
  return <ComandaTicket store={store} />
}

/**
 * On a computer the comanda sits beside the menu, like a check on the counter.
 * On a phone it lives in a drawer opened from the bar at the bottom.
 * Only one of the two is mounted, so the form never exists twice.
 */
export function ComandaPanel({ store }: { store: Store }) {
  const isDesktop = useIsDesktop()
  return isDesktop ? <ComandaColumn store={store} /> : <ComandaBar store={store} />
}

function ComandaColumn({ store }: { store: Store }) {
  return (
    <aside aria-label="Comanda" className="pt-10">
      <div className="sticky top-6 max-h-[calc(100dvh-3rem)] overflow-y-auto px-1 pt-2 pb-6">
        <ComandaSteps store={store} />
      </div>
    </aside>
  )
}

function ComandaBar({ store }: { store: Store }) {
  const items = useCartStore((state) => state.items)
  const { isDrawerOpen, setDrawerOpen, sentOrder } = useCheckoutStore()
  const count = cartCount(items)

  if (count === 0 && !sentOrder) return null

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 p-3 backdrop-blur">
        <Button size="lg" className="w-full justify-between" onClick={() => setDrawerOpen(true)}>
          <span className="flex items-center gap-2">
            <ChevronUpIcon data-icon="inline-start" />
            {count > 0 ? "Ver comanda" : "Ver pedido enviado"}
            {count > 0 && (
              // Remounts on every change, so the bump plays once per added item.
              <span
                key={count}
                className="animate-bump rounded-full bg-primary-foreground px-2 text-sm text-primary tabular-nums"
              >
                {count}
              </span>
            )}
          </span>
          {count > 0 && <span className="tabular-nums">{formatBRL(cartSubtotal(items))}</span>}
        </Button>
      </div>

      <Drawer open={isDrawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <DrawerTitle className="sr-only">Comanda</DrawerTitle>
          <div
            className="min-h-0 flex-1 overflow-y-auto px-4 pt-6 pb-8"
            style={{ "--perforation": "var(--popover)" } as React.CSSProperties}
          >
            <ComandaSteps store={store} />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}
