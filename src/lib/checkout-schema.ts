import { z } from "zod"

import { parseMoneyToCents } from "@/lib/money"

export const onlyDigits = (value: string) => value.replace(/\D/g, "")

const optionalText = (max: number) => z.string().trim().max(max)

/**
 * The checkout form. Every field is a string so the form can bind to it
 * directly; the server reads the digits and cents out of them again.
 * The same schema runs in the browser (instant feedback) and in the server
 * action (the browser can be bypassed).
 */
export const checkoutSchema = z
  .object({
    customerName: z.string().trim().min(2, "Informe seu nome.").max(80),
    customerPhone: z
      .string()
      .refine((v) => /^\d{10,11}$/.test(onlyDigits(v)), "Informe o telefone com DDD."),
    fulfillment: z.enum(["delivery", "pickup"]),
    cep: z.string(),
    street: optionalText(120),
    number: optionalText(20),
    complement: optionalText(60),
    deliveryZoneId: z.string(),
    reference: optionalText(120),
    paymentMethod: z.enum(["pix", "credit_card", "debit_card", "cash"], {
      error: "Escolha a forma de pagamento.",
    }),
    changeFor: z.string(),
    notes: optionalText(300),
  })
  .superRefine((values, ctx) => {
    if (values.fulfillment === "delivery") {
      if (!/^\d{8}$/.test(onlyDigits(values.cep))) {
        ctx.addIssue({ code: "custom", path: ["cep"], message: "Informe um CEP com 8 números." })
      }
      if (!values.street) {
        ctx.addIssue({ code: "custom", path: ["street"], message: "Informe a rua." })
      }
      if (!values.number) {
        ctx.addIssue({ code: "custom", path: ["number"], message: "Informe o número." })
      }
      if (!values.deliveryZoneId) {
        ctx.addIssue({ code: "custom", path: ["deliveryZoneId"], message: "Escolha o bairro." })
      }
    }
    if (values.paymentMethod === "cash" && values.changeFor.trim() !== "") {
      if (parseMoneyToCents(values.changeFor) === null) {
        ctx.addIssue({
          code: "custom",
          path: ["changeFor"],
          message: "Informe o valor em reais, por exemplo 100.",
        })
      }
    }
  })

export type CheckoutValues = z.infer<typeof checkoutSchema>

export const emptyCheckout: CheckoutValues = {
  customerName: "",
  customerPhone: "",
  fulfillment: "delivery",
  cep: "",
  street: "",
  number: "",
  complement: "",
  deliveryZoneId: "",
  reference: "",
  paymentMethod: "pix",
  changeFor: "",
  notes: "",
}

/** One line of the comanda, as the browser sends it. Prices are never sent. */
export const orderItemInputSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(50),
  notes: optionalText(140),
  selections: z
    .array(z.object({ optionId: z.string().uuid(), quantity: z.number().int().min(1) }))
    .max(30),
})

export type OrderItemInput = z.infer<typeof orderItemInputSchema>

export const createOrderInputSchema = z.object({
  checkout: checkoutSchema,
  items: z.array(orderItemInputSchema).min(1, "A comanda está vazia.").max(40),
  turnstileToken: z.string(),
})

export type CreateOrderInput = z.infer<typeof createOrderInputSchema>
