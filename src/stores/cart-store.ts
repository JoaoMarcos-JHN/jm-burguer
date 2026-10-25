"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

import type { OrderItemInput } from "@/lib/checkout-schema"
import type { OptionSelection } from "@/lib/pricing"

/**
 * One line of the comanda. Names and prices are kept only to draw the
 * comanda; the server prices the order again from the database.
 */
export type CartItem = {
  key: string
  productId: string
  name: string
  imageUrl: string | null
  unitPriceCents: number
  quantity: number
  notes: string
  selections: OptionSelection[]
  /** "Ao ponto, 2x Bacon extra", ready to print under the item name. */
  summary: string
}

type CartState = {
  items: CartItem[]
  add: (item: Omit<CartItem, "key">) => void
  setQuantity: (key: string, quantity: number) => void
  remove: (key: string) => void
  clear: () => void
}

/** The same burger with the same choices and notes stacks on one line. */
function itemKey(item: Pick<CartItem, "productId" | "selections" | "notes">): string {
  const selections = [...item.selections]
    .sort((a, b) => a.optionId.localeCompare(b.optionId))
    .map((s) => `${s.optionId}x${s.quantity}`)
    .join(",")
  return `${item.productId}|${selections}|${item.notes.trim().toLowerCase()}`
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (item) =>
        set((state) => {
          const key = itemKey(item)
          const existing = state.items.find((i) => i.key === key)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.key === key ? { ...i, quantity: i.quantity + item.quantity } : i,
              ),
            }
          }
          return { items: [...state.items, { ...item, key }] }
        }),
      setQuantity: (key, quantity) =>
        set((state) => ({
          items:
            quantity < 1
              ? state.items.filter((i) => i.key !== key)
              : state.items.map((i) => (i.key === key ? { ...i, quantity } : i)),
        })),
      remove: (key) => set((state) => ({ items: state.items.filter((i) => i.key !== key) })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "jm-burguer-comanda",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Read localStorage only after the page has hydrated, so the server HTML
      // (an empty comanda) and the first client render match. See CartHydrator.
      skipHydration: true,
    },
  ),
)

export const cartCount = (items: CartItem[]) => items.reduce((sum, i) => sum + i.quantity, 0)

export const cartSubtotal = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0)

export const toOrderItems = (items: CartItem[]): OrderItemInput[] =>
  items.map(({ productId, quantity, notes, selections }) => ({
    productId,
    quantity,
    notes,
    selections,
  }))
