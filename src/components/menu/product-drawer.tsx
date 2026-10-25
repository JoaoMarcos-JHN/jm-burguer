"use client"

import Image from "next/image"
import { useId, useRef, useState } from "react"

import { OptionGroupField, type Picked } from "@/components/menu/option-group-field"
import { QuantityStepper } from "@/components/quantity-stepper"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import type { MenuProduct } from "@/lib/menu/types"
import { formatBRL } from "@/lib/money"
import {
  resolveSelections,
  unitPriceCents,
  validateSelections,
  type OptionSelection,
} from "@/lib/pricing"
import { useCartStore } from "@/stores/cart-store"

type ProductDrawerProps = {
  product: MenuProduct | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Changes on every opening, so the form starts clean each time. */
  openKey: number
}

export function ProductDrawer({ product, open, onOpenChange, openKey }: ProductDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="sm:mx-auto sm:max-w-xl">
        {product && (
          <ProductForm
            key={`${product.id}-${openKey}`}
            product={product}
            onAdded={() => onOpenChange(false)}
          />
        )}
      </DrawerContent>
    </Drawer>
  )
}

const toSelections = (picked: Picked): OptionSelection[] =>
  Object.entries(picked).map(([optionId, quantity]) => ({ optionId, quantity }))

function ProductForm({ product, onAdded }: { product: MenuProduct; onAdded: () => void }) {
  const notesId = useId()
  const groupsRef = useRef<HTMLDivElement>(null)
  const [picked, setPicked] = useState<Picked>({})
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState("")
  const [showErrors, setShowErrors] = useState(false)
  const add = useCartStore((state) => state.add)

  const selections = toSelections(picked)
  const errors = validateSelections(product, selections)
  const unit = unitPriceCents(product, selections)

  const handleAdd = () => {
    if (errors.length > 0) {
      setShowErrors(true)
      groupsRef.current
        ?.querySelector("[data-invalid]")
        ?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }
    add({
      productId: product.id,
      name: product.name,
      imageUrl: product.imageUrl,
      unitPriceCents: unit,
      quantity,
      notes: notes.trim(),
      selections,
      summary: resolveSelections(product, selections)
        .map(({ option, quantity: q }) => (q > 1 ? `${q}x ${option.name}` : option.name))
        .join(", "),
    })
    onAdded()
  }

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-6 pb-4">
        <div className="flex items-start gap-4">
          {product.imageUrl && (
            <div className="size-28 shrink-0 overflow-hidden rounded-full bg-card shadow-[0_0_0_4px_var(--card),0_0_0_5px_var(--border)]">
              <Image
                src={product.imageUrl}
                alt={product.name}
                width={112}
                height={112}
                className="size-full object-cover"
              />
            </div>
          )}
          <div className="flex flex-col gap-1">
            <DrawerTitle className="text-2xl leading-tight font-bold font-stretch-[78%]">
              {product.name}
            </DrawerTitle>
            {product.description && (
              <DrawerDescription className="text-left text-base">
                {product.description}
              </DrawerDescription>
            )}
            <span className="font-semibold tabular-nums">{formatBRL(product.priceCents)}</span>
          </div>
        </div>

        <FieldGroup ref={groupsRef} className="mt-6">
          {product.optionGroups.map((group) => (
            <OptionGroupField
              key={group.id}
              group={group}
              picked={picked}
              onChange={setPicked}
              error={showErrors ? errors.find((e) => e.groupId === group.id)?.message : undefined}
            />
          ))}
          <Field>
            <FieldLabel htmlFor={notesId}>Alguma observação?</FieldLabel>
            <Textarea
              id={notesId}
              value={notes}
              maxLength={140}
              placeholder="Ex.: sem cebola, molho à parte"
              onChange={(event) => setNotes(event.target.value)}
            />
          </Field>
        </FieldGroup>
      </div>

      <DrawerFooter className="gap-3 border-t pt-3">
        <div className="flex items-center justify-between">
          <QuantityStepper
            label={product.name}
            value={quantity}
            min={1}
            max={20}
            onChange={setQuantity}
          />
          <span className="text-lg font-bold tabular-nums">{formatBRL(unit * quantity)}</span>
        </div>
        <Button size="lg" className="w-full" onClick={handleAdd}>
          Adicionar à comanda
        </Button>
      </DrawerFooter>
    </>
  )
}
