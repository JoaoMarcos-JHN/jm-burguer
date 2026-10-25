import { describe, expect, it } from "vitest"

import { formatBRL, formatPrice, parseMoneyToCents } from "@/lib/money"

describe("formatBRL", () => {
  it("formats cents as reais with a plain space", () => {
    expect(formatBRL(3499)).toBe("R$ 34,99")
    expect(formatBRL(0)).toBe("R$ 0,00")
    expect(formatBRL(123456)).toBe("R$ 1.234,56")
  })
})

describe("formatPrice", () => {
  it("formats without the currency symbol", () => {
    expect(formatPrice(599)).toBe("5,99")
  })
})

describe("parseMoneyToCents", () => {
  it.each([
    ["100", 10000],
    ["100,5", 10050],
    ["100,50", 10050],
    ["R$ 1.000,00", 100000],
    ["50,", 5000],
  ])("reads %s as %i cents", (input, cents) => {
    expect(parseMoneyToCents(input)).toBe(cents)
  })

  it("returns null when there is no number", () => {
    expect(parseMoneyToCents("")).toBeNull()
    expect(parseMoneyToCents("abc")).toBeNull()
  })
})
