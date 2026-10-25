"use client"

import { Button } from "@/components/ui/button"
import { formatBRL } from "@/lib/money"
import { formatOrderNumber } from "@/lib/whatsapp"
import { useCheckoutStore, type SentOrder } from "@/stores/checkout-store"

/** After the order is saved: the comanda gets its number. */
export function OrderSent({ order }: { order: SentOrder }) {
  const startOver = useCheckoutStore((state) => state.startOver)

  return (
    <div className="flex flex-col gap-4">
      <div className="comanda-paper flex flex-col gap-2 rounded-b-lg px-4 pb-6">
        <span className="text-sm text-ticket-ink">Pedido registrado</span>
        <span className="font-display text-6xl leading-none text-primary">
          {formatOrderNumber(order.number)}
        </span>
        <span className="font-semibold tabular-nums">Total {formatBRL(order.totalCents)}</span>
        <p className="mt-2">
          O WhatsApp abriu com o pedido escrito. Toque em enviar por lá para a loja receber.
        </p>
      </div>
      <Button
        size="lg"
        className="w-full"
        nativeButton={false}
        render={<a href={order.whatsappUrl} target="_blank" rel="noopener noreferrer" />}
      >
        Abrir o WhatsApp de novo
      </Button>
      <Button variant="ghost" className="w-full" onClick={startOver}>
        Fazer outro pedido
      </Button>
    </div>
  )
}
