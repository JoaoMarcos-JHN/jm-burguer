import { describe, expect, it } from "vitest"

import {
  buildOrderMessage,
  buildWhatsAppUrl,
  formatOrderNumber,
  formatPhone,
  type OrderMessage,
} from "@/lib/whatsapp"

const order: OrderMessage = {
  number: 142,
  storeName: "JM Burguer",
  customerName: "Ana",
  customerPhone: "19999998888",
  fulfillment: "delivery",
  address: {
    street: "Rua Maria Monteiro",
    number: "10",
    complement: "apto 32",
    neighborhood: "Cambuí",
    cep: "13024000",
    reference: "Portão azul",
  },
  items: [
    {
      quantity: 2,
      name: "Clássico JM",
      lineTotalCents: 8198,
      options: [
        { name: "Ao ponto", quantity: 1 },
        { name: "Bacon extra", quantity: 2 },
      ],
      notes: "sem cebola",
    },
    { quantity: 1, name: "Coca-Cola Lata", lineTotalCents: 599, options: [] },
  ],
  subtotalCents: 8797,
  deliveryFeeCents: 600,
  totalCents: 9397,
  paymentMethod: "cash",
  changeForCents: 10000,
}

describe("buildOrderMessage", () => {
  it("writes a delivery order the restaurant can read at a glance", () => {
    expect(buildOrderMessage(order)).toBe(
      [
        "*Pedido #0142* - JM Burguer",
        "",
        "2x Clássico JM - R$ 81,98",
        "   Ao ponto, 2x Bacon extra",
        "   Obs.: sem cebola",
        "1x Coca-Cola Lata - R$ 5,99",
        "",
        "Subtotal: R$ 87,97",
        "Entrega (Cambuí): R$ 6,00",
        "*Total: R$ 93,97*",
        "",
        "*Entrega*",
        "Rua Maria Monteiro, 10 - apto 32",
        "Cambuí - CEP 13024-000",
        "Referência: Portão azul",
        "",
        "*Pagamento*",
        "Dinheiro, troco para R$ 100,00",
        "",
        "*Cliente*",
        "Ana - (19) 99999-8888",
      ].join("\n"),
    )
  })

  it("writes pickup and Pix orders", () => {
    const message = buildOrderMessage({
      ...order,
      fulfillment: "pickup",
      address: undefined,
      deliveryFeeCents: 0,
      totalCents: 8797,
      paymentMethod: "pix",
      changeForCents: null,
      pixKey: "pix@jmburguer.exemplo",
      notes: "Vou buscar às 20h",
    })
    expect(message).toContain("*Retirada no local*")
    expect(message).not.toContain("Entrega (")
    expect(message).toContain("Pix (chave pix@jmburguer.exemplo). Envio o comprovante aqui.")
    expect(message.endsWith("Observações: Vou buscar às 20h")).toBe(true)
  })
})

describe("buildWhatsAppUrl", () => {
  it("encodes the message into a wa.me link", () => {
    expect(buildWhatsAppUrl("5519900000000", "*Pedido* #1\nok")).toBe(
      "https://wa.me/5519900000000?text=*Pedido*%20%231%0Aok",
    )
  })
})

describe("formatters", () => {
  it("pads the order number", () => {
    expect(formatOrderNumber(7)).toBe("#0007")
    expect(formatOrderNumber(12345)).toBe("#12345")
  })

  it("formats mobile and landline phones", () => {
    expect(formatPhone("19999998888")).toBe("(19) 99999-8888")
    expect(formatPhone("1932221111")).toBe("(19) 3222-1111")
  })
})
