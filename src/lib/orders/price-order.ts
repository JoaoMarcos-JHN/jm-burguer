import type { CheckoutValues, OrderItemInput } from "@/lib/checkout-schema"
import { onlyDigits } from "@/lib/checkout-schema"
import type { Menu, MenuProduct } from "@/lib/menu/types"
import { formatBRL, parseMoneyToCents } from "@/lib/money"
import { resolveSelections, unitPriceCents, validateSelections } from "@/lib/pricing"
import { getStoreStatus } from "@/lib/store-hours"

export type PricedItem = {
  productId: string
  productName: string
  unitPriceCents: number
  quantity: number
  lineTotalCents: number
  notes: string
  options: {
    optionId: string
    groupName: string
    optionName: string
    unitPriceCents: number
    quantity: number
  }[]
}

export type PricedOrder = {
  items: PricedItem[]
  subtotalCents: number
  deliveryFeeCents: number
  totalCents: number
  changeForCents: number | null
  customerPhone: string
  cep: string
  neighborhood: string | null
}

export type PriceOrderResult = { ok: true; order: PricedOrder } | { ok: false; error: string }

/**
 * Rebuilds the whole order from the menu in the database. Nothing the browser
 * says about prices is trusted: it only sends product ids, option ids and
 * quantities. Pure function, so the rules are covered by tests.
 */
export function priceOrder(
  menu: Menu,
  checkout: CheckoutValues,
  items: OrderItemInput[],
  now: Date,
): PriceOrderResult {
  const { store } = menu

  const status = getStoreStatus(store.hours, now, store.timezone, store.isTemporarilyClosed)
  if (!status.isOpen) {
    return { ok: false, error: "A loja está fechada agora. O pedido não foi enviado." }
  }

  if (checkout.fulfillment === "pickup" && !store.acceptsPickup) {
    return { ok: false, error: "Esta loja não faz retirada no local. Escolha entrega." }
  }

  const products = new Map<string, MenuProduct>(
    menu.categories.flatMap((c) => c.products).map((p) => [p.id, p]),
  )

  const priced: PricedItem[] = []
  for (const item of items) {
    const product = products.get(item.productId)
    if (!product) {
      return {
        ok: false,
        error: "Um item da comanda saiu do cardápio. Remova-o e tente de novo.",
      }
    }

    const errors = validateSelections(product, item.selections)
    if (errors.length > 0) {
      return { ok: false, error: `${product.name}: ${errors[0].message}` }
    }

    const unit = unitPriceCents(product, item.selections)
    priced.push({
      productId: product.id,
      productName: product.name,
      unitPriceCents: product.priceCents,
      quantity: item.quantity,
      lineTotalCents: unit * item.quantity,
      notes: item.notes,
      options: resolveSelections(product, item.selections).map(({ group, option, quantity }) => ({
        optionId: option.id,
        groupName: group.name,
        optionName: option.name,
        unitPriceCents: option.priceCents,
        quantity,
      })),
    })
  }

  const subtotalCents = priced.reduce((sum, item) => sum + item.lineTotalCents, 0)
  if (subtotalCents < store.minOrderCents) {
    return {
      ok: false,
      error: `O pedido mínimo é ${formatBRL(store.minOrderCents)}, sem contar a entrega.`,
    }
  }

  let deliveryFeeCents = 0
  let neighborhood: string | null = null
  if (checkout.fulfillment === "delivery") {
    const zone = store.deliveryZones.find((z) => z.id === checkout.deliveryZoneId)
    if (!zone) {
      return { ok: false, error: "Não entregamos nesse bairro. Escolha um bairro da lista." }
    }
    deliveryFeeCents = zone.feeCents
    neighborhood = zone.neighborhood
  }

  const totalCents = subtotalCents + deliveryFeeCents

  let changeForCents: number | null = null
  if (checkout.paymentMethod === "cash" && checkout.changeFor.trim() !== "") {
    changeForCents = parseMoneyToCents(checkout.changeFor)
    if (changeForCents === null || changeForCents < totalCents) {
      return {
        ok: false,
        error: `O troco precisa ser para um valor a partir de ${formatBRL(totalCents)}.`,
      }
    }
  }

  return {
    ok: true,
    order: {
      items: priced,
      subtotalCents,
      deliveryFeeCents,
      totalCents,
      changeForCents,
      customerPhone: onlyDigits(checkout.customerPhone),
      cep: onlyDigits(checkout.cep),
      neighborhood,
    },
  }
}
