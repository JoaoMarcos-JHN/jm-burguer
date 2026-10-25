import type { Menu, MenuProduct } from "@/lib/menu/types"

// UUIDs are required by the order input schema, so the fixtures use real ones.
export const ids = {
  classico: "11111111-1111-4111-8111-111111111111",
  coca: "22222222-2222-4222-8222-222222222222",
  pointGroup: "33333333-3333-4333-8333-333333333331",
  extrasGroup: "33333333-3333-4333-8333-333333333332",
  aoPonto: "44444444-4444-4444-8444-444444444441",
  malPassado: "44444444-4444-4444-8444-444444444442",
  bacon: "44444444-4444-4444-8444-444444444443",
  cheddar: "44444444-4444-4444-8444-444444444444",
  centro: "55555555-5555-4555-8555-555555555551",
  cambui: "55555555-5555-4555-8555-555555555552",
}

export const classico: MenuProduct = {
  id: ids.classico,
  name: "Clássico JM",
  slug: "classico-jm",
  description: null,
  priceCents: 3099,
  imageUrl: null,
  isFeatured: false,
  optionGroups: [
    {
      id: ids.pointGroup,
      name: "Ponto da carne",
      minSelect: 1,
      maxSelect: 1,
      options: [
        { id: ids.aoPonto, name: "Ao ponto", priceCents: 0, maxQuantity: 1 },
        { id: ids.malPassado, name: "Mal passado", priceCents: 0, maxQuantity: 1 },
      ],
    },
    {
      id: ids.extrasGroup,
      name: "Adicionais",
      minSelect: 0,
      maxSelect: 3,
      options: [
        { id: ids.bacon, name: "Bacon extra", priceCents: 500, maxQuantity: 2 },
        { id: ids.cheddar, name: "Cheddar extra", priceCents: 300, maxQuantity: 2 },
      ],
    },
  ],
}

export const coca: MenuProduct = {
  id: ids.coca,
  name: "Coca-Cola Lata",
  slug: "coca-cola-lata",
  description: "350 ml.",
  priceCents: 599,
  imageUrl: null,
  isFeatured: false,
  optionGroups: [],
}

export const menu: Menu = {
  store: {
    name: "JM Burguer",
    tagline: null,
    address: "Rua Afonso Vieira, 10 - Campinas, SP",
    whatsappNumber: "5519900000000",
    pixKey: "pix@jmburguer.exemplo",
    instagramUrl: null,
    timezone: "America/Sao_Paulo",
    acceptsPickup: true,
    minOrderCents: 2000,
    isTemporarilyClosed: false,
    // Thursday to Sunday, 18:00 to 23:00
    hours: [4, 5, 6, 0].map((weekday) => ({ weekday, opensAt: "18:00", closesAt: "23:00" })),
    deliveryZones: [
      { id: ids.centro, neighborhood: "Centro", feeCents: 500 },
      { id: ids.cambui, neighborhood: "Cambuí", feeCents: 600 },
    ],
  },
  categories: [
    { id: "c1", name: "Burgers", slug: "burgers", products: [classico] },
    { id: "c2", name: "Bebidas", slug: "bebidas", products: [coca] },
  ],
}

/** Builds a Date for a São Paulo wall-clock time (UTC-3, no daylight saving). */
export function saoPaulo(isoLocal: string): Date {
  return new Date(`${isoLocal}-03:00`)
}
