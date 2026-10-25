import "server-only"

import { cacheLife, cacheTag } from "next/cache"

import type { Menu, MenuCategory, Store } from "@/lib/menu/types"
import { createPublicClient, productImageUrl } from "@/lib/supabase/clients"

const bySortOrder = <T extends { sort_order: number }>(a: T, b: T) => a.sort_order - b.sort_order

/** Postgres returns "18:00:00"; the app works with "18:00". */
const hhmm = (time: string) => time.slice(0, 5)

async function loadStore(): Promise<Store> {
  const supabase = createPublicClient()
  const [settings, hours, zones] = await Promise.all([
    supabase.from("store_settings").select("*").single(),
    supabase.from("opening_hours").select("weekday, opens_at, closes_at"),
    supabase
      .from("delivery_zones")
      .select("id, neighborhood, fee_cents, sort_order")
      .order("sort_order"),
  ])
  if (settings.error) throw settings.error
  if (hours.error) throw hours.error
  if (zones.error) throw zones.error

  const s = settings.data
  return {
    name: s.name,
    tagline: s.tagline,
    address: s.address,
    whatsappNumber: s.whatsapp_number,
    pixKey: s.pix_key,
    instagramUrl: s.instagram_url,
    timezone: s.timezone,
    acceptsPickup: s.accepts_pickup,
    minOrderCents: s.min_order_cents,
    isTemporarilyClosed: s.is_temporarily_closed,
    hours: hours.data.map((h) => ({
      weekday: h.weekday,
      opensAt: hhmm(h.opens_at),
      closesAt: hhmm(h.closes_at),
    })),
    deliveryZones: zones.data.map((z) => ({
      id: z.id,
      neighborhood: z.neighborhood,
      feeCents: z.fee_cents,
    })),
  }
}

async function loadCategories(): Promise<MenuCategory[]> {
  const supabase = createPublicClient()
  const { data, error } = await supabase.from("categories").select(`
      id, name, slug, sort_order,
      products (
        id, name, slug, description, price_cents, image_path, is_featured, sort_order,
        product_option_groups (
          sort_order,
          option_groups ( id, name, min_select, max_select,
            options ( id, name, price_cents, max_quantity, sort_order )
          )
        )
      )
    `)
  if (error) throw error

  return data
    .sort(bySortOrder)
    .map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      products: category.products.sort(bySortOrder).map((product) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        priceCents: product.price_cents,
        imageUrl: productImageUrl(product.image_path),
        isFeatured: product.is_featured,
        optionGroups: product.product_option_groups
          .sort(bySortOrder)
          .map(({ option_groups: group }) => ({
            id: group.id,
            name: group.name,
            minSelect: group.min_select,
            maxSelect: group.max_select,
            options: group.options.sort(bySortOrder).map((option) => ({
              id: option.id,
              name: option.name,
              priceCents: option.price_cents,
              maxQuantity: option.max_quantity,
            })),
          }))
          // A required group whose options were all switched off would block the product.
          .filter((group) => group.options.length > 0 || group.minSelect === 0),
      })),
    }))
    .filter((category) => category.products.length > 0)
}

/** Straight from the database. Used when an order is placed, where stale prices are not acceptable. */
export async function loadMenu(): Promise<Menu> {
  const [store, categories] = await Promise.all([loadStore(), loadCategories()])
  return { store, categories }
}

/**
 * Cached for the menu page, so most visits never reach the database.
 * The V2 admin panel will call updateTag("menu") after each change.
 */
export async function getMenu(): Promise<Menu> {
  "use cache"
  cacheLife("hours")
  cacheTag("menu")
  return loadMenu()
}
