import { formatBRL } from "@/lib/money"

export type PaymentMethod = "pix" | "credit_card" | "debit_card" | "cash"

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  pix: "Pix",
  credit_card: "Cartão de crédito na entrega",
  debit_card: "Cartão de débito na entrega",
  cash: "Dinheiro",
}

export type OrderMessage = {
  number: number
  storeName: string
  customerName: string
  customerPhone: string
  fulfillment: "delivery" | "pickup"
  address?: {
    street: string
    number: string
    complement?: string
    neighborhood: string
    cep: string
    reference?: string
  }
  items: {
    quantity: number
    name: string
    lineTotalCents: number
    options: { name: string; quantity: number }[]
    notes?: string
  }[]
  subtotalCents: number
  deliveryFeeCents: number
  totalCents: number
  paymentMethod: PaymentMethod
  changeForCents?: number | null
  pixKey?: string | null
  notes?: string
}

/** 142 -> "#0142" */
export function formatOrderNumber(number: number): string {
  return `#${String(number).padStart(4, "0")}`
}

/** "19999998888" -> "(19) 99999-8888" */
export function formatPhone(digits: string): string {
  const match = digits.match(/^(\d{2})(\d{4,5})(\d{4})$/)
  return match ? `(${match[1]}) ${match[2]}-${match[3]}` : digits
}

/** "13024000" -> "13024-000" */
export function formatCep(digits: string): string {
  return digits.replace(/^(\d{5})(\d{3})$/, "$1-$2")
}

function optionsLine(options: OrderMessage["items"][number]["options"]): string {
  return options.map((o) => (o.quantity > 1 ? `${o.quantity}x ${o.name}` : o.name)).join(", ")
}

/** The text the customer sends. *asterisks* are bold in WhatsApp. */
export function buildOrderMessage(order: OrderMessage): string {
  const lines: string[] = [`*Pedido ${formatOrderNumber(order.number)}* - ${order.storeName}`, ""]

  for (const item of order.items) {
    lines.push(`${item.quantity}x ${item.name} - ${formatBRL(item.lineTotalCents)}`)
    if (item.options.length > 0) lines.push(`   ${optionsLine(item.options)}`)
    if (item.notes) lines.push(`   Obs.: ${item.notes}`)
  }

  lines.push("", `Subtotal: ${formatBRL(order.subtotalCents)}`)
  if (order.fulfillment === "delivery" && order.address) {
    lines.push(`Entrega (${order.address.neighborhood}): ${formatBRL(order.deliveryFeeCents)}`)
  }
  lines.push(`*Total: ${formatBRL(order.totalCents)}*`, "")

  if (order.fulfillment === "delivery" && order.address) {
    const { street, number, complement, neighborhood, cep, reference } = order.address
    lines.push("*Entrega*")
    lines.push(`${street}, ${number}${complement ? ` - ${complement}` : ""}`)
    lines.push(`${neighborhood} - CEP ${formatCep(cep)}`)
    if (reference) lines.push(`Referência: ${reference}`)
  } else {
    lines.push("*Retirada no local*")
  }
  lines.push("")

  lines.push("*Pagamento*")
  if (order.paymentMethod === "pix") {
    lines.push(order.pixKey ? `Pix (chave ${order.pixKey}). Envio o comprovante aqui.` : "Pix")
  } else if (order.paymentMethod === "cash") {
    lines.push(
      order.changeForCents
        ? `Dinheiro, troco para ${formatBRL(order.changeForCents)}`
        : "Dinheiro, sem troco",
    )
  } else {
    lines.push(PAYMENT_LABELS[order.paymentMethod])
  }
  lines.push("")

  lines.push("*Cliente*", `${order.customerName} - ${formatPhone(order.customerPhone)}`)
  if (order.notes) lines.push("", `Observações: ${order.notes}`)

  return lines.join("\n")
}

/** whatsappNumber is digits only, with country code: "5519900000000". */
export function buildWhatsAppUrl(whatsappNumber: string, message: string): string {
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
}
