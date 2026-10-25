"use client"

import { useState } from "react"

import { ProductDrawer } from "@/components/menu/product-drawer"
import { ProductRow } from "@/components/menu/product-row"
import type { MenuCategory, MenuProduct } from "@/lib/menu/types"

/** The menu sections and the drawer where a dish is customized. */
export function MenuBoard({ categories }: { categories: MenuCategory[] }) {
  const [selected, setSelected] = useState<MenuProduct | null>(null)
  const [open, setOpen] = useState(false)
  const [openKey, setOpenKey] = useState(0)

  const select = (product: MenuProduct) => {
    setSelected(product)
    setOpenKey((key) => key + 1)
    setOpen(true)
  }

  return (
    <>
      <div className="flex flex-col gap-10 pt-8 pb-12">
        {categories.map((category) => (
          <section key={category.id} id={category.slug} aria-labelledby={`${category.slug}-title`}>
            <h2 id={`${category.slug}-title`} className="font-display text-4xl">
              {category.name}
            </h2>
            <ul className="mt-2 flex flex-col divide-y">
              {category.products.map((product) => (
                <ProductRow key={product.id} product={product} onSelect={select} />
              ))}
            </ul>
          </section>
        ))}
      </div>
      <ProductDrawer product={selected} open={open} onOpenChange={setOpen} openKey={openKey} />
    </>
  )
}
