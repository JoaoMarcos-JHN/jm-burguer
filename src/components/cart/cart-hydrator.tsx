"use client"

import { useEffect } from "react"

import { useCustomerStore } from "@/stores/checkout-store"
import { useCartStore } from "@/stores/cart-store"

/** Loads the saved comanda and customer details once the page is interactive. */
export function CartHydrator() {
  useEffect(() => {
    void useCartStore.persist.rehydrate()
    void useCustomerStore.persist.rehydrate()
  }, [])
  return null
}
