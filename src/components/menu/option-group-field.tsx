"use client"

import { useId } from "react"

import { QuantityStepper } from "@/components/quantity-stepper"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { MenuOption, MenuOptionGroup } from "@/lib/menu/types"
import { formatBRL } from "@/lib/money"

/** optionId -> quantity, only for picked options. */
export type Picked = Record<string, number>

type OptionGroupFieldProps = {
  group: MenuOptionGroup
  picked: Picked
  onChange: (picked: Picked) => void
  error?: string
}

function groupHint(group: MenuOptionGroup): string {
  const { minSelect: min, maxSelect: max } = group
  if (min > 0)
    return min === max ? `Obrigatório. Escolha ${min}.` : `Obrigatório. Escolha de ${min} a ${max}.`
  return max === 1 ? "Opcional." : `Opcional. Até ${max}.`
}

function OptionPrice({ option }: { option: MenuOption }) {
  if (option.priceCents === 0) return null
  return <span className="text-sm tabular-nums">+ {formatBRL(option.priceCents)}</span>
}

export function OptionGroupField({ group, picked, onChange, error }: OptionGroupFieldProps) {
  const baseId = useId()
  const inGroup = group.options.reduce((sum, o) => sum + (picked[o.id] ?? 0), 0)
  const isFull = inGroup >= group.maxSelect

  const set = (optionId: string, quantity: number) => {
    const next = { ...picked }
    if (quantity > 0) next[optionId] = quantity
    else delete next[optionId]
    onChange(next)
  }

  // "Pick exactly one" is a radio list; everything else counts toward a limit.
  const isSingleChoice = group.minSelect === 1 && group.maxSelect === 1

  return (
    <FieldSet data-invalid={error ? true : undefined}>
      <FieldLegend className="text-lg font-bold font-stretch-[85%]">{group.name}</FieldLegend>
      <FieldDescription>{groupHint(group)}</FieldDescription>

      {isSingleChoice ? (
        <RadioGroup
          value={group.options.find((o) => picked[o.id])?.id ?? null}
          onValueChange={(value) => {
            const next = { ...picked }
            for (const option of group.options) delete next[option.id]
            next[value as string] = 1
            onChange(next)
          }}
        >
          {group.options.map((option) => {
            const id = `${baseId}-${option.id}`
            return (
              <FieldLabel key={option.id} htmlFor={id}>
                <Field orientation="horizontal">
                  <RadioGroupItem id={id} value={option.id} aria-invalid={!!error} />
                  <FieldContent>
                    <FieldTitle>{option.name}</FieldTitle>
                  </FieldContent>
                  <OptionPrice option={option} />
                </Field>
              </FieldLabel>
            )
          })}
        </RadioGroup>
      ) : (
        <div className="flex flex-col gap-2">
          {group.options.map((option) => {
            const id = `${baseId}-${option.id}`
            const quantity = picked[option.id] ?? 0

            if (option.maxQuantity > 1) {
              return (
                <Field key={option.id} orientation="horizontal" className="rounded-lg border p-2.5">
                  <FieldContent>
                    <FieldTitle>{option.name}</FieldTitle>
                    <OptionPrice option={option} />
                  </FieldContent>
                  <QuantityStepper
                    label={option.name}
                    value={quantity}
                    max={Math.min(option.maxQuantity, quantity + (group.maxSelect - inGroup))}
                    onChange={(value) => set(option.id, value)}
                  />
                </Field>
              )
            }

            return (
              <FieldLabel key={option.id} htmlFor={id}>
                <Field
                  orientation="horizontal"
                  data-disabled={isFull && !quantity ? true : undefined}
                >
                  <Checkbox
                    id={id}
                    checked={quantity > 0}
                    disabled={isFull && !quantity}
                    onCheckedChange={(checked) => set(option.id, checked ? 1 : 0)}
                  />
                  <FieldContent>
                    <FieldTitle>{option.name}</FieldTitle>
                  </FieldContent>
                  <OptionPrice option={option} />
                </Field>
              </FieldLabel>
            )
          })}
        </div>
      )}

      {error && <FieldError>{error}</FieldError>}
    </FieldSet>
  )
}
