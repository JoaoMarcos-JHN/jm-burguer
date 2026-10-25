import type { MenuOption, MenuOptionGroup, MenuProduct } from "@/lib/menu/types"

/** What the customer picked inside a product: "2x Bacon extra". */
export type OptionSelection = {
  optionId: string
  quantity: number
}

export type SelectionError = {
  /** The group the error belongs to, or null when the option is unknown. */
  groupId: string | null
  message: string
}

function findOption(product: MenuProduct, optionId: string) {
  for (const group of product.optionGroups) {
    const option = group.options.find((o) => o.id === optionId)
    if (option) return { group, option }
  }
  return null
}

function groupRuleMessage(group: MenuOptionGroup, picked: number): string | null {
  if (picked < group.minSelect) {
    return group.minSelect === 1
      ? `Escolha uma opção em "${group.name}".`
      : `Escolha pelo menos ${group.minSelect} opções em "${group.name}".`
  }
  if (picked > group.maxSelect) {
    return group.maxSelect === 1
      ? `Escolha só uma opção em "${group.name}".`
      : `Escolha no máximo ${group.maxSelect} opções em "${group.name}".`
  }
  return null
}

/**
 * Checks the picked options against the product's groups.
 * A group's count is the sum of quantities, so "2x Bacon extra" uses 2 of the
 * 5 slots in "Adicionais". Returns an empty array when everything is valid.
 */
export function validateSelections(
  product: MenuProduct,
  selections: OptionSelection[],
): SelectionError[] {
  const errors: SelectionError[] = []
  const pickedPerGroup = new Map<string, number>()
  const seen = new Set<string>()

  for (const selection of selections) {
    const found = findOption(product, selection.optionId)
    if (!found || seen.has(selection.optionId)) {
      errors.push({ groupId: null, message: "Uma das opções escolhidas não está mais disponível." })
      continue
    }
    seen.add(selection.optionId)

    const { group, option } = found
    if (
      !Number.isInteger(selection.quantity) ||
      selection.quantity < 1 ||
      selection.quantity > option.maxQuantity
    ) {
      errors.push({
        groupId: group.id,
        message: `"${option.name}" aceita no máximo ${option.maxQuantity}.`,
      })
    }
    pickedPerGroup.set(group.id, (pickedPerGroup.get(group.id) ?? 0) + selection.quantity)
  }

  for (const group of product.optionGroups) {
    const message = groupRuleMessage(group, pickedPerGroup.get(group.id) ?? 0)
    if (message) errors.push({ groupId: group.id, message })
  }

  return errors
}

export type ResolvedSelection = {
  group: MenuOptionGroup
  option: MenuOption
  quantity: number
}

/** Pairs each selection with its group and option, in the menu's order. */
export function resolveSelections(
  product: MenuProduct,
  selections: OptionSelection[],
): ResolvedSelection[] {
  const quantities = new Map(selections.map((s) => [s.optionId, s.quantity]))
  return product.optionGroups.flatMap((group) =>
    group.options
      .filter((option) => quantities.has(option.id))
      .map((option) => ({ group, option, quantity: quantities.get(option.id)! })),
  )
}

/** Price of one unit: base price plus every picked option. */
export function unitPriceCents(product: MenuProduct, selections: OptionSelection[]): number {
  return resolveSelections(product, selections).reduce(
    (sum, { option, quantity }) => sum + option.priceCents * quantity,
    product.priceCents,
  )
}
