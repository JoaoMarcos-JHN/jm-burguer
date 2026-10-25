import { describe, expect, it } from "vitest"

import { resolveSelections, unitPriceCents, validateSelections } from "@/lib/pricing"
import { classico, ids } from "@/test/fixtures"

describe("validateSelections", () => {
  it("accepts a required choice plus extras", () => {
    expect(
      validateSelections(classico, [
        { optionId: ids.aoPonto, quantity: 1 },
        { optionId: ids.bacon, quantity: 2 },
      ]),
    ).toEqual([])
  })

  it("asks for the required group when it is missing", () => {
    const errors = validateSelections(classico, [])
    expect(errors).toEqual([
      { groupId: ids.pointGroup, message: 'Escolha uma opção em "Ponto da carne".' },
    ])
  })

  it("rejects two choices in a single-choice group", () => {
    const errors = validateSelections(classico, [
      { optionId: ids.aoPonto, quantity: 1 },
      { optionId: ids.malPassado, quantity: 1 },
    ])
    expect(errors[0].message).toBe('Escolha só uma opção em "Ponto da carne".')
  })

  it("counts quantities toward the group maximum", () => {
    // 2 bacon + 2 cheddar = 4, the group allows 3
    const errors = validateSelections(classico, [
      { optionId: ids.aoPonto, quantity: 1 },
      { optionId: ids.bacon, quantity: 2 },
      { optionId: ids.cheddar, quantity: 2 },
    ])
    expect(errors[0].message).toBe('Escolha no máximo 3 opções em "Adicionais".')
  })

  it("rejects more of one option than it allows", () => {
    const errors = validateSelections(classico, [
      { optionId: ids.aoPonto, quantity: 1 },
      { optionId: ids.bacon, quantity: 3 },
    ])
    expect(errors.map((e) => e.message)).toContain('"Bacon extra" aceita no máximo 2.')
  })

  it("rejects an option that is not on the product", () => {
    const errors = validateSelections(classico, [
      { optionId: ids.aoPonto, quantity: 1 },
      { optionId: ids.centro, quantity: 1 },
    ])
    expect(errors[0].groupId).toBeNull()
  })
})

describe("unitPriceCents", () => {
  it("adds every option times its quantity to the base price", () => {
    const price = unitPriceCents(classico, [
      { optionId: ids.aoPonto, quantity: 1 },
      { optionId: ids.bacon, quantity: 2 },
      { optionId: ids.cheddar, quantity: 1 },
    ])
    expect(price).toBe(3099 + 2 * 500 + 300)
  })
})

describe("resolveSelections", () => {
  it("returns options in menu order, not in the order they were picked", () => {
    const resolved = resolveSelections(classico, [
      { optionId: ids.bacon, quantity: 1 },
      { optionId: ids.aoPonto, quantity: 1 },
    ])
    expect(resolved.map((r) => r.option.name)).toEqual(["Ao ponto", "Bacon extra"])
  })
})
