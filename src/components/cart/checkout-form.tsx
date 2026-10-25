"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile"
import { ArrowLeftIcon, CopyIcon } from "lucide-react"
import { useId, useRef, useState, useTransition } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  checkoutSchema,
  emptyCheckout,
  onlyDigits,
  type CheckoutValues,
} from "@/lib/checkout-schema"
import type { Store } from "@/lib/menu/types"
import { formatBRL } from "@/lib/money"
import { createOrder } from "@/lib/orders/create-order"
import { cartCount, cartSubtotal, toOrderItems, useCartStore } from "@/stores/cart-store"
import { useCheckoutStore, useCustomerStore } from "@/stores/checkout-store"

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

const PAYMENT_OPTIONS = [
  { value: "pix", label: "Pix" },
  { value: "credit_card", label: "Crédito" },
  { value: "debit_card", label: "Débito" },
  { value: "cash", label: "Dinheiro" },
] as const

/** "19999998888" -> "(19) 99999-8888" while the person types. */
function maskPhone(value: string): string {
  const d = onlyDigits(value).slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : ""
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  const split = d.length === 11 ? 7 : 6
  return `(${d.slice(0, 2)}) ${d.slice(2, split)}-${d.slice(split)}`
}

function maskCep(value: string): string {
  const d = onlyDigits(value).slice(0, 8)
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d
}

const normalize = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase()

type CepLookup =
  | { state: "idle" | "loading" | "found" }
  | { state: "not-found" | "failed" }
  | { state: "outside"; neighborhood: string }

export function CheckoutForm({ store }: { store: Store }) {
  const id = useId()
  const items = useCartStore((state) => state.items)
  const clearCart = useCartStore((state) => state.clear)
  const { goTo, markSent } = useCheckoutStore()
  const saveCustomer = useCustomerStore((state) => state.save)

  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [turnstileToken, setTurnstileToken] = useState("")
  const turnstileRef = useRef<TurnstileInstance>(null)
  const [cep, setCep] = useState<CepLookup>({ state: "idle" })
  const [pixCopied, setPixCopied] = useState(false)

  const form = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    mode: "onTouched",
    defaultValues: {
      ...emptyCheckout,
      ...useCustomerStore.getState().saved,
      ...(store.acceptsPickup ? {} : { fulfillment: "delivery" }),
    },
  })
  const [fulfillment, paymentMethod, deliveryZoneId] = useWatch({
    control: form.control,
    name: ["fulfillment", "paymentMethod", "deliveryZoneId"],
  })

  const subtotal = cartSubtotal(items)
  const zone = store.deliveryZones.find((z) => z.id === deliveryZoneId)
  const fee = fulfillment === "delivery" ? (zone?.feeCents ?? 0) : 0

  const zoneItems = [
    { label: "Escolha o bairro", value: null },
    ...store.deliveryZones.map((z) => ({
      label: `${z.neighborhood} (entrega ${formatBRL(z.feeCents)})`,
      value: z.id,
    })),
  ]

  async function lookupCep(digits: string) {
    setCep({ state: "loading" })
    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
      const data = (await response.json()) as {
        erro?: boolean
        logradouro?: string
        bairro?: string
      }
      if (data.erro) {
        setCep({ state: "not-found" })
        return
      }
      if (data.logradouro) form.setValue("street", data.logradouro, { shouldValidate: true })
      const match = store.deliveryZones.find(
        (z) => data.bairro && normalize(z.neighborhood) === normalize(data.bairro),
      )
      if (match) {
        form.setValue("deliveryZoneId", match.id, { shouldValidate: true })
        setCep({ state: "found" })
      } else {
        setCep({ state: "outside", neighborhood: data.bairro ?? "" })
      }
      form.setFocus("number")
    } catch {
      setCep({ state: "failed" })
    }
  }

  const submit = (values: CheckoutValues) => {
    setServerError(null)
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setServerError("Aguarde a verificação de segurança terminar e envie de novo.")
      return
    }
    startTransition(async () => {
      const result = await createOrder({
        checkout: values,
        items: toOrderItems(items),
        turnstileToken,
      })
      if (!result.ok) {
        setServerError(result.error)
        turnstileRef.current?.reset()
        setTurnstileToken("")
        return
      }
      saveCustomer({
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        fulfillment: values.fulfillment,
        cep: values.cep,
        street: values.street,
        number: values.number,
        complement: values.complement,
        deliveryZoneId: values.deliveryZoneId,
        reference: values.reference,
      })
      clearCart()
      markSent({
        number: result.orderNumber,
        totalCents: result.totalCents,
        whatsappUrl: result.whatsappUrl,
      })
      window.location.assign(result.whatsappUrl)
    })
  }

  return (
    <form
      onSubmit={(event) => void form.handleSubmit(submit)(event)}
      noValidate
      className="flex flex-col gap-6"
    >
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Voltar para a comanda"
          onClick={() => goTo("comanda")}
        >
          <ArrowLeftIcon />
        </Button>
        <h2 className="font-display text-3xl">Entrega</h2>
      </div>

      <FieldGroup>
        {store.acceptsPickup && (
          <Controller
            control={form.control}
            name="fulfillment"
            render={({ field }) => (
              <FieldSet>
                <FieldLegend className="sr-only">Como você quer receber</FieldLegend>
                <ToggleGroup
                  variant="outline"
                  className="grid w-full grid-cols-2"
                  value={[field.value]}
                  onValueChange={(value) => value[0] && field.onChange(value[0])}
                >
                  <ToggleGroupItem value="delivery">Entrega</ToggleGroupItem>
                  <ToggleGroupItem value="pickup">Retirar na loja</ToggleGroupItem>
                </ToggleGroup>
                {field.value === "pickup" && (
                  <FieldDescription>Retirada em {store.address}.</FieldDescription>
                )}
              </FieldSet>
            )}
          />
        )}

        <Controller
          control={form.control}
          name="customerName"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`${id}-name`}>Seu nome</FieldLabel>
              <Input
                {...field}
                id={`${id}-name`}
                autoComplete="name"
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="customerPhone"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`${id}-phone`}>Telefone com DDD</FieldLabel>
              <Input
                {...field}
                id={`${id}-phone`}
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                placeholder="(19) 99999-9999"
                aria-invalid={fieldState.invalid}
                onChange={(event) => field.onChange(maskPhone(event.target.value))}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        {fulfillment === "delivery" && (
          <>
            <Controller
              control={form.control}
              name="cep"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`${id}-cep`}>CEP</FieldLabel>
                  <div className="flex items-center gap-2">
                    <Input
                      {...field}
                      id={`${id}-cep`}
                      inputMode="numeric"
                      autoComplete="postal-code"
                      placeholder="13000-000"
                      className="max-w-40"
                      aria-invalid={fieldState.invalid}
                      onChange={(event) => {
                        const masked = maskCep(event.target.value)
                        field.onChange(masked)
                        const digits = onlyDigits(masked)
                        if (digits.length === 8) void lookupCep(digits)
                      }}
                    />
                    {cep.state === "loading" && <Spinner />}
                  </div>
                  {cep.state === "not-found" && (
                    <FieldDescription>
                      Não achamos esse CEP. Preencha a rua e o bairro.
                    </FieldDescription>
                  )}
                  {cep.state === "failed" && (
                    <FieldDescription>
                      Não deu para buscar o CEP agora. Preencha a rua e o bairro.
                    </FieldDescription>
                  )}
                  {cep.state === "outside" && (
                    <FieldDescription>
                      {cep.neighborhood
                        ? `${cep.neighborhood} não está na lista de entrega.`
                        : "Esse CEP não está na lista de entrega."}{" "}
                      Confira se seu bairro aparece abaixo com outro nome.
                    </FieldDescription>
                  )}
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="street"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`${id}-street`}>Rua</FieldLabel>
                  <Input
                    {...field}
                    id={`${id}-street`}
                    autoComplete="address-line1"
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <div className="grid grid-cols-[7rem_1fr] gap-3">
              <Controller
                control={form.control}
                name="number"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`${id}-number`}>Número</FieldLabel>
                    <Input
                      {...field}
                      id={`${id}-number`}
                      inputMode="numeric"
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="complement"
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor={`${id}-complement`}>Complemento</FieldLabel>
                    <Input
                      {...field}
                      id={`${id}-complement`}
                      autoComplete="address-line2"
                      placeholder="Apto, bloco"
                    />
                  </Field>
                )}
              />
            </div>

            <Controller
              control={form.control}
              name="deliveryZoneId"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`${id}-zone`}>Bairro</FieldLabel>
                  <Select
                    items={zoneItems}
                    value={field.value || null}
                    onValueChange={(value) => field.onChange(value ?? "")}
                  >
                    <SelectTrigger
                      id={`${id}-zone`}
                      className="w-full"
                      aria-invalid={fieldState.invalid}
                      onBlur={field.onBlur}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {zoneItems.map((item) => (
                          <SelectItem key={item.value ?? "none"} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldDescription>Só entregamos nos bairros da lista.</FieldDescription>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="reference"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor={`${id}-reference`}>Ponto de referência</FieldLabel>
                  <Input {...field} id={`${id}-reference`} placeholder="Opcional" />
                </Field>
              )}
            />
          </>
        )}

        <Controller
          control={form.control}
          name="paymentMethod"
          render={({ field, fieldState }) => (
            <FieldSet data-invalid={fieldState.invalid}>
              <FieldLegend>Pagamento na entrega</FieldLegend>
              <ToggleGroup
                variant="outline"
                className="grid w-full grid-cols-2"
                value={[field.value]}
                onValueChange={(value) => value[0] && field.onChange(value[0])}
              >
                {PAYMENT_OPTIONS.map((option) => (
                  <ToggleGroupItem key={option.value} value={option.value}>
                    {option.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              {field.value === "pix" && store.pixKey && (
                <div className="flex flex-col gap-2 rounded-lg bg-secondary p-3">
                  <span className="text-sm">Chave Pix da loja</span>
                  <div className="flex items-center justify-between gap-2">
                    <code className="truncate font-semibold">{store.pixKey}</code>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        await navigator.clipboard.writeText(store.pixKey!)
                        setPixCopied(true)
                      }}
                    >
                      <CopyIcon data-icon="inline-start" />
                      {pixCopied ? "Chave copiada" : "Copiar chave"}
                    </Button>
                  </div>
                  <span className="text-sm text-ticket-ink">
                    Depois de pagar, mande o comprovante na mesma conversa do pedido.
                  </span>
                </div>
              )}
              <FieldError errors={[fieldState.error]} />
            </FieldSet>
          )}
        />

        {paymentMethod === "cash" && (
          <Controller
            control={form.control}
            name="changeFor"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`${id}-change`}>Troco para quanto?</FieldLabel>
                <Input
                  {...field}
                  id={`${id}-change`}
                  inputMode="decimal"
                  placeholder="Ex.: 100"
                  className="max-w-40"
                  aria-invalid={fieldState.invalid}
                />
                <FieldDescription>Deixe em branco se não precisar de troco.</FieldDescription>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        )}

        <Controller
          control={form.control}
          name="notes"
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor={`${id}-notes`}>Observações para a loja</FieldLabel>
              <Textarea {...field} id={`${id}-notes`} maxLength={300} placeholder="Opcional" />
            </Field>
          )}
        />
      </FieldGroup>

      <div className="comanda-paper flex flex-col gap-1 rounded-b-lg px-4 pb-4">
        <div className="flex justify-between">
          <span>
            {cartCount(items)} {cartCount(items) === 1 ? "item" : "itens"}
          </span>
          <span className="tabular-nums">{formatBRL(subtotal)}</span>
        </div>
        {fulfillment === "delivery" && (
          <div className="flex justify-between">
            <span>Entrega{zone ? ` (${zone.neighborhood})` : ""}</span>
            <span className="tabular-nums">{zone ? formatBRL(fee) : "escolha o bairro"}</span>
          </div>
        )}
        <div className="flex items-baseline justify-between border-t border-ticket-ink/40 pt-2">
          <span className="font-semibold">Total</span>
          <span className="text-2xl font-bold text-primary tabular-nums">
            {formatBRL(subtotal + fee)}
          </span>
        </div>
      </div>

      {TURNSTILE_SITE_KEY && (
        <Turnstile
          ref={turnstileRef}
          siteKey={TURNSTILE_SITE_KEY}
          onSuccess={setTurnstileToken}
          onExpire={() => setTurnstileToken("")}
          options={{ language: "pt-br", size: "flexible" }}
        />
      )}

      {serverError && (
        <Alert variant="destructive">
          <AlertTitle>O pedido não foi enviado</AlertTitle>
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending && <Spinner data-icon="inline-start" />}
        Enviar pedido pelo WhatsApp
      </Button>
    </form>
  )
}
