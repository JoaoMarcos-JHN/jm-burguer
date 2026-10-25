import { describe, expect, it } from "vitest"

import { emptyCheckout, type CheckoutValues } from "@/lib/checkout-schema"
import { priceOrder } from "@/lib/orders/price-order"
import { ids, menu, saoPaulo } from "@/test/fixtures"

const open = saoPaulo("2026-10-29T19:30") // Thursday, open

const delivery: CheckoutValues = {
  ...emptyCheckout,
  customerName: "Ana",
  customerPhone: "(19) 99999-8888",
  cep: "13024-000",
  street: "Rua Maria Monteiro",
  number: "10",
  deliveryZoneId: ids.cambui,
}

const burgerWithBacon = {
  productId: ids.classico,
  quantity: 2,
  notes: "sem cebola",
  selections: [
    { optionId: ids.aoPonto, quantity: 1 },
    { optionId: ids.bacon, quantity: 1 },
  ],
}

const twoCokes = { productId: ids.coca, quantity: 2, notes: "", selections: [] }

describe("priceOrder", () => {
  it("prices items, options and the neighborhood fee from the menu", () => {
    const result = priceOrder(menu, delivery, [burgerWithBacon, twoCokes], open)
    if (!result.ok) throw new Error(result.error)

    const [burger, cokes] = result.order.items
    expect(burger.lineTotalCents).toBe((3099 + 500) * 2)
    expect(burger.unitPriceCents).toBe(3099) // base price only
    expect(burger.options.map((o) => o.optionName)).toEqual(["Ao ponto", "Bacon extra"])
    expect(cokes.lineTotalCents).toBe(1198)

    expect(result.order.subtotalCents).toBe(7198 + 1198)
    expect(result.order.deliveryFeeCents).toBe(600)
    expect(result.order.totalCents).toBe(7198 + 1198 + 600)
    expect(result.order.neighborhood).toBe("Cambuí")
    expect(result.order.customerPhone).toBe("19999998888")
    expect(result.order.cep).toBe("13024000")
  })

  it("charges no fee for pickup", () => {
    const result = priceOrder(menu, { ...delivery, fulfillment: "pickup" }, [burgerWithBacon], open)
    if (!result.ok) throw new Error(result.error)
    expect(result.order.deliveryFeeCents).toBe(0)
    expect(result.order.totalCents).toBe(result.order.subtotalCents)
  })

  it("refuses orders while the store is closed", () => {
    const monday = saoPaulo("2026-10-26T19:30")
    const result = priceOrder(menu, delivery, [burgerWithBacon], monday)
    expect(result).toEqual({
      ok: false,
      error: "A loja está fechada agora. O pedido não foi enviado.",
    })
  })

  it("refuses a product that left the menu", () => {
    const gone = { ...twoCokes, productId: "99999999-9999-4999-8999-999999999999" }
    const result = priceOrder(menu, delivery, [burgerWithBacon, gone], open)
    expect(result.ok).toBe(false)
  })

  it("refuses an item with an invalid choice", () => {
    const noPoint = { ...burgerWithBacon, selections: [] }
    const result = priceOrder(menu, delivery, [noPoint], open)
    expect(result).toEqual({
      ok: false,
      error: 'Clássico JM: Escolha uma opção em "Ponto da carne".',
    })
  })

  it("enforces the minimum order without counting the delivery fee", () => {
    const oneCoke = { ...twoCokes, quantity: 1 }
    const result = priceOrder(menu, delivery, [oneCoke], open)
    expect(result).toEqual({
      ok: false,
      error: "O pedido mínimo é R$ 20,00, sem contar a entrega.",
    })
  })

  it("refuses a neighborhood outside the delivery list", () => {
    const result = priceOrder(
      menu,
      { ...delivery, deliveryZoneId: ids.bacon },
      [twoCokes, twoCokes],
      open,
    )
    expect(result.ok).toBe(false)
  })

  it("accepts change for an amount at or above the total", () => {
    const cash = { ...delivery, paymentMethod: "cash" as const, changeFor: "100" }
    const result = priceOrder(menu, cash, [burgerWithBacon], open)
    if (!result.ok) throw new Error(result.error)
    expect(result.order.changeForCents).toBe(10000)
  })

  it("refuses change for less than the total", () => {
    const cash = { ...delivery, paymentMethod: "cash" as const, changeFor: "50" }
    const result = priceOrder(menu, cash, [burgerWithBacon], open)
    expect(result).toEqual({
      ok: false,
      error: "O troco precisa ser para um valor a partir de R$ 77,98.",
    })
  })
})
