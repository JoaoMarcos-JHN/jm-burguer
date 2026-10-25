"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

import type { CheckoutValues } from "@/lib/checkout-schema"

export type CheckoutStep = "comanda" | "checkout" | "sent"

export type SentOrder = {
  number: number
  totalCents: number
  whatsappUrl: string
}

type CheckoutState = {
  step: CheckoutStep
  /** The phone drawer; the desktop column is always visible. */
  isDrawerOpen: boolean
  sentOrder: SentOrder | null
  goTo: (step: CheckoutStep) => void
  setDrawerOpen: (open: boolean) => void
  markSent: (order: SentOrder) => void
  startOver: () => void
}

export const useCheckoutStore = create<CheckoutState>()((set) => ({
  step: "comanda",
  isDrawerOpen: false,
  sentOrder: null,
  goTo: (step) => set({ step }),
  setDrawerOpen: (isDrawerOpen) => set({ isDrawerOpen }),
  markSent: (sentOrder) => set({ step: "sent", sentOrder }),
  startOver: () => set({ step: "comanda", sentOrder: null }),
}))

/** The customer's details, kept so the next order is one tap away. */
export type SavedCustomer = Omit<CheckoutValues, "changeFor" | "notes" | "paymentMethod">

type CustomerState = {
  saved: SavedCustomer | null
  save: (customer: SavedCustomer) => void
}

export const useCustomerStore = create<CustomerState>()(
  persist(
    (set) => ({
      saved: null,
      save: (saved) => set({ saved }),
    }),
    { name: "jm-burguer-cliente", version: 1, skipHydration: true },
  ),
)
