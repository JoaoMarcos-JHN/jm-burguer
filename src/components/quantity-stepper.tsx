"use client"

import { MinusIcon, PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

type QuantityStepperProps = {
  value: number
  onChange: (value: number) => void
  /** What is being counted, read by screen readers: "Bacon extra". */
  label: string
  min?: number
  max?: number
}

export function QuantityStepper({ value, onChange, label, min = 0, max }: QuantityStepperProps) {
  return (
    <div role="group" aria-label={`Quantidade de ${label}`} className="flex items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label={`Tirar um ${label}`}
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
      >
        <MinusIcon />
      </Button>
      <span aria-live="polite" className="min-w-7 text-center font-semibold tabular-nums">
        {value}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label={`Pôr mais um ${label}`}
        disabled={max !== undefined && value >= max}
        onClick={() => onChange(value + 1)}
      >
        <PlusIcon />
      </Button>
    </div>
  )
}
