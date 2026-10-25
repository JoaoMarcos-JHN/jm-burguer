// All money in the app is integer cents. Conversion to reais happens only here.

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })

const plain = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** 3499 -> "R$ 34,99" */
export function formatBRL(cents: number): string {
  // Intl separates "R$" with a no-break space; a plain space copies better into WhatsApp.
  return brl.format(cents / 100).replace(/ /g, " ")
}

/** 3499 -> "34,99", for menu columns where "R$" would be noise. */
export function formatPrice(cents: number): string {
  return plain.format(cents / 100)
}

/**
 * Reads what a person types as an amount of money.
 * "100" -> 10000, "100,5" -> 10050, "R$ 1.000,00" -> 100000.
 * Returns null when there is no amount to read.
 */
export function parseMoneyToCents(input: string): number | null {
  const cleaned = input.replace(/[^\d,]/g, "")
  if (!/\d/.test(cleaned)) return null

  const [reais = "", centavos = ""] = cleaned.split(",")
  const cents = Number(reais || "0") * 100 + Number(centavos.padEnd(2, "0").slice(0, 2))
  return Number.isSafeInteger(cents) ? cents : null
}
