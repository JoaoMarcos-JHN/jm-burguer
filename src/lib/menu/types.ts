// Shapes the app works with. The database rows are mapped into these in
// lib/menu/queries.ts, so components never deal with snake_case columns.

export type MenuOption = {
  id: string
  name: string
  priceCents: number
  maxQuantity: number
}

export type MenuOptionGroup = {
  id: string
  name: string
  minSelect: number
  maxSelect: number
  options: MenuOption[]
}

export type MenuProduct = {
  id: string
  name: string
  slug: string
  description: string | null
  priceCents: number
  imageUrl: string | null
  isFeatured: boolean
  optionGroups: MenuOptionGroup[]
}

export type MenuCategory = {
  id: string
  name: string
  slug: string
  products: MenuProduct[]
}

/** weekday follows Date.getDay(): 0 = Sunday. Times are "HH:MM". */
export type OpeningShift = {
  weekday: number
  opensAt: string
  closesAt: string
}

export type DeliveryZone = {
  id: string
  neighborhood: string
  feeCents: number
}

export type Store = {
  name: string
  tagline: string | null
  address: string
  whatsappNumber: string
  pixKey: string | null
  instagramUrl: string | null
  timezone: string
  acceptsPickup: boolean
  minOrderCents: number
  isTemporarilyClosed: boolean
  hours: OpeningShift[]
  deliveryZones: DeliveryZone[]
}

export type Menu = {
  store: Store
  categories: MenuCategory[]
}
