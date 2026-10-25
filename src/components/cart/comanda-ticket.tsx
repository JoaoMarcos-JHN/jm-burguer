"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { QuantityStepper } from "@/components/quantity-stepper"
import { useStoreStatus } from "@/hooks/use-store-status"
import type { Store } from "@/lib/menu/types"
import { formatBRL, formatPrice } from "@/lib/money"
import { describeNextOpening } from "@/lib/store-hours"
import { cartCount, cartSubtotal, useCartStore } from "@/stores/cart-store"
import { useCheckoutStore } from "@/stores/checkout-store"

/** The guest check: what has been ordered so far. */
export function ComandaTicket({ store }: { store: Store }) {
  const items = useCartStore((state) => state.items)
  const setQuantity = useCartStore((state) => state.setQuantity)
  const goTo = useCheckoutStore((state) => state.goTo)
  const status = useStoreStatus(store)

  const count = cartCount(items)
  const subtotal = cartSubtotal(items)
  const missing = store.minOrderCents - subtotal
  const isClosed = status !== null && !status.isOpen

  return (
    <div className="flex flex-col gap-4">
      <div className="comanda-paper rounded-b-lg px-4 pb-4">
        <div className="flex items-baseline justify-between border-b-2 border-ticket-ink/40 pb-2">
          <h2 className="font-display text-3xl">Comanda</h2>
          {count > 0 && (
            <span className="text-sm text-ticket-ink">
              {count} {count === 1 ? "item" : "itens"}
            </span>
          )}
        </div>

        {items.length === 0 ? (
          <Empty className="px-0 py-8">
            <EmptyHeader>
              <EmptyTitle>Nada anotado ainda</EmptyTitle>
              <EmptyDescription className="text-ticket-ink">
                Toque num item do cardápio para começar o pedido.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <ul className="flex flex-col">
              {items.map((item) => (
                <li
                  key={item.key}
                  className="flex animate-in flex-col gap-1 border-b border-ticket-ink/25 py-3 fade-in slide-in-from-top-1 motion-reduce:animate-none"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-semibold">
                      <span className="tabular-nums">{item.quantity}x</span> {item.name}
                    </span>
                    <span className="tabular-nums">
                      {formatPrice(item.unitPriceCents * item.quantity)}
                    </span>
                  </div>
                  {item.summary && <p className="text-sm text-ticket-ink">{item.summary}</p>}
                  {item.notes && <p className="text-sm text-ticket-ink">Obs.: {item.notes}</p>}
                  <div className="mt-1">
                    <QuantityStepper
                      label={item.name}
                      value={item.quantity}
                      max={50}
                      onChange={(quantity) => setQuantity(item.key, quantity)}
                    />
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex items-baseline justify-between pt-3">
              <span>Subtotal</span>
              <span className="text-2xl font-bold text-primary tabular-nums">
                {formatBRL(subtotal)}
              </span>
            </div>
            <p className="text-sm text-ticket-ink">A entrega é calculada no próximo passo.</p>
          </>
        )}
      </div>

      {isClosed && (
        <Alert>
          <AlertTitle>Estamos fechados agora</AlertTitle>
          <AlertDescription>
            {describeNextOpening(status) ?? "Sem previsão de abertura no momento"}. Sua comanda fica
            guardada até lá.
          </AlertDescription>
        </Alert>
      )}
      {items.length > 0 && missing > 0 && (
        <p className="text-sm">
          Faltam {formatBRL(missing)} para o pedido mínimo de {formatBRL(store.minOrderCents)}.
        </p>
      )}

      <Button
        size="lg"
        className="w-full"
        disabled={items.length === 0 || isClosed || status === null || missing > 0}
        onClick={() => goTo("checkout")}
      >
        Continuar para entrega
      </Button>
    </div>
  )
}
