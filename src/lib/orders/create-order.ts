"use server"

import { createOrderInputSchema, onlyDigits, type CreateOrderInput } from "@/lib/checkout-schema"
import { loadMenu } from "@/lib/menu/queries"
import { priceOrder } from "@/lib/orders/price-order"
import { createServiceClient } from "@/lib/supabase/clients"
import { buildOrderMessage, buildWhatsAppUrl } from "@/lib/whatsapp"

export type CreateOrderResult =
  | { ok: true; orderNumber: number; totalCents: number; whatsappUrl: string }
  | { ok: false; error: string }

async function verifyTurnstile(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) {
    // Without a key the check is off, which is only acceptable while developing.
    return process.env.NODE_ENV !== "production"
  }
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: new URLSearchParams({ secret, response: token }),
  })
  const result = (await response.json()) as { success: boolean }
  return result.success
}

const GENERIC_ERROR = "Não foi possível registrar o pedido. Tente de novo em instantes."

/**
 * Called by the checkout form. Anyone can POST to a server action, so it
 * checks everything again: the form fields, the captcha, the store hours and
 * every price, recalculated from the database.
 */
export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const parsed = createOrderInputSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? GENERIC_ERROR }
  }
  const { checkout, items, turnstileToken } = parsed.data

  if (!(await verifyTurnstile(turnstileToken))) {
    return { ok: false, error: "Confirme que você não é um robô e envie de novo." }
  }

  const menu = await loadMenu()
  const priced = priceOrder(menu, checkout, items, new Date())
  if (!priced.ok) return priced

  const { order } = priced
  const isDelivery = checkout.fulfillment === "delivery"

  const supabase = createServiceClient()
  const { data, error } = await supabase.rpc("create_order", {
    p_order: {
      customer_name: checkout.customerName,
      customer_phone: order.customerPhone,
      fulfillment: checkout.fulfillment,
      delivery_zone_id: isDelivery ? checkout.deliveryZoneId : null,
      address_cep: isDelivery ? order.cep : null,
      address_street: isDelivery ? checkout.street : null,
      address_number: isDelivery ? checkout.number : null,
      address_complement: isDelivery ? checkout.complement : null,
      address_neighborhood: order.neighborhood,
      address_reference: isDelivery ? checkout.reference : null,
      payment_method: checkout.paymentMethod,
      change_for_cents: order.changeForCents,
      subtotal_cents: order.subtotalCents,
      delivery_fee_cents: order.deliveryFeeCents,
      total_cents: order.totalCents,
      notes: checkout.notes,
    },
    p_items: order.items.map((item) => ({
      product_id: item.productId,
      product_name: item.productName,
      unit_price_cents: item.unitPriceCents,
      quantity: item.quantity,
      line_total_cents: item.lineTotalCents,
      notes: item.notes,
      options: item.options.map((option) => ({
        option_id: option.optionId,
        group_name: option.groupName,
        option_name: option.optionName,
        unit_price_cents: option.unitPriceCents,
        quantity: option.quantity,
      })),
    })),
  })

  const created = data?.[0]
  if (error || !created) {
    console.error("create_order failed", error)
    return { ok: false, error: GENERIC_ERROR }
  }

  const message = buildOrderMessage({
    number: created.number,
    storeName: menu.store.name,
    customerName: checkout.customerName,
    customerPhone: onlyDigits(checkout.customerPhone),
    fulfillment: checkout.fulfillment,
    address: isDelivery
      ? {
          street: checkout.street,
          number: checkout.number,
          complement: checkout.complement,
          neighborhood: order.neighborhood ?? "",
          cep: order.cep,
          reference: checkout.reference,
        }
      : undefined,
    items: order.items.map((item) => ({
      quantity: item.quantity,
      name: item.productName,
      lineTotalCents: item.lineTotalCents,
      notes: item.notes,
      options: item.options.map((o) => ({ name: o.optionName, quantity: o.quantity })),
    })),
    subtotalCents: order.subtotalCents,
    deliveryFeeCents: order.deliveryFeeCents,
    totalCents: order.totalCents,
    paymentMethod: checkout.paymentMethod,
    changeForCents: order.changeForCents,
    pixKey: menu.store.pixKey,
    notes: checkout.notes,
  })

  return {
    ok: true,
    orderNumber: created.number,
    totalCents: order.totalCents,
    whatsappUrl: buildWhatsAppUrl(menu.store.whatsappNumber, message),
  }
}
