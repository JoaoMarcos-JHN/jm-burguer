"use client"

import Image from "next/image"

import { Badge } from "@/components/ui/badge"
import type { MenuProduct } from "@/lib/menu/types"
import { formatPrice } from "@/lib/money"

type ProductRowProps = {
  product: MenuProduct
  onSelect: (product: MenuProduct) => void
}

/** A line of the printed menu: name, dotted leader, price, and the dish on its plate. */
export function ProductRow({ product, onSelect }: ProductRowProps) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(product)}
        className="group flex w-full items-center gap-4 rounded-lg py-4 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/60"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-baseline gap-2">
            <span className="text-xl leading-tight font-bold font-stretch-[78%] group-hover:text-primary">
              {product.name}
            </span>
            <span aria-hidden className="menu-leader" />
            <span className="text-lg font-semibold tabular-nums">
              <span className="sr-only">R$ </span>
              {formatPrice(product.priceCents)}
            </span>
          </div>
          {product.isFeatured && <Badge variant="featured">Carro-chefe</Badge>}
          {product.description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
          )}
        </div>
        <div className="size-20 shrink-0 overflow-hidden rounded-full bg-card shadow-[0_0_0_4px_var(--card),0_0_0_5px_var(--border)] sm:size-24">
          {product.imageUrl && (
            <Image
              src={product.imageUrl}
              alt=""
              width={96}
              height={96}
              className="size-full object-cover"
            />
          )}
        </div>
      </button>
    </li>
  )
}
