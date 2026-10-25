import { describe, expect, it } from "vitest"

import { describeStoreStatus, formatHour, getStoreStatus, summarizeHours } from "@/lib/store-hours"
import { menu, saoPaulo } from "@/test/fixtures"

const { hours, timezone } = menu.store
const statusAt = (isoLocal: string) => getStoreStatus(hours, saoPaulo(isoLocal), timezone)

// 2026-10-29 is a Thursday.
describe("getStoreStatus", () => {
  it("is open during a shift", () => {
    expect(statusAt("2026-10-29T19:30")).toEqual({ isOpen: true, closesAt: "23:00" })
  })

  it("closes exactly at closing time", () => {
    expect(statusAt("2026-10-29T23:00").isOpen).toBe(false)
  })

  it("points to later today before opening", () => {
    expect(statusAt("2026-10-29T15:00")).toEqual({
      isOpen: false,
      nextOpening: { daysFromNow: 0, weekday: 4, opensAt: "18:00" },
    })
  })

  it("skips closed days: Monday points to Thursday", () => {
    expect(statusAt("2026-10-26T12:00")).toEqual({
      isOpen: false,
      nextOpening: { daysFromNow: 3, weekday: 4, opensAt: "18:00" },
    })
  })

  it("uses the store's timezone, not the visitor's", () => {
    // 22:30 UTC on Thursday is 19:30 in São Paulo
    const status = getStoreStatus(hours, new Date("2026-10-29T22:30:00Z"), timezone)
    expect(status.isOpen).toBe(true)
  })

  it("keeps a shift that crosses midnight open after midnight", () => {
    const lateFriday = [{ weekday: 5, opensAt: "18:00", closesAt: "02:00" }]
    // 2026-10-31 is a Saturday
    const status = getStoreStatus(lateFriday, saoPaulo("2026-10-31T01:00"), timezone)
    expect(status).toEqual({ isOpen: true, closesAt: "02:00" })
  })

  it("keeps a Saturday shift open into Sunday, across the week boundary", () => {
    const lateSaturday = [{ weekday: 6, opensAt: "20:00", closesAt: "03:00" }]
    // 2026-11-01 is a Sunday
    const status = getStoreStatus(lateSaturday, saoPaulo("2026-11-01T02:00"), timezone)
    expect(status.isOpen).toBe(true)
  })

  it("is closed with no next opening when the owner closes the store", () => {
    const status = getStoreStatus(hours, saoPaulo("2026-10-29T19:30"), timezone, true)
    expect(status).toEqual({ isOpen: false, nextOpening: null })
  })
})

describe("describeStoreStatus", () => {
  it.each([
    ["2026-10-29T19:30", "Aberto até 23h"],
    ["2026-10-29T15:00", "Fechado agora. Abrimos hoje às 18h"],
    ["2026-10-29T23:30", "Fechado agora. Abrimos amanhã às 18h"],
    ["2026-10-26T12:00", "Fechado agora. Abrimos quinta às 18h"],
  ])("at %s says %s", (isoLocal, text) => {
    expect(describeStoreStatus(statusAt(isoLocal))).toBe(text)
  })
})

describe("summarizeHours", () => {
  it("writes consecutive days as a range", () => {
    expect(summarizeHours(hours)).toBe("Qui a dom, 18h às 23h")
  })

  it("splits days that are not consecutive and different times", () => {
    const mixed = [
      { weekday: 1, opensAt: "11:00", closesAt: "15:00" },
      { weekday: 3, opensAt: "11:00", closesAt: "15:00" },
      { weekday: 5, opensAt: "18:00", closesAt: "23:30" },
      { weekday: 6, opensAt: "18:00", closesAt: "23:30" },
    ]
    expect(summarizeHours(mixed)).toBe("Seg e qua, 11h às 15h; sex e sáb, 18h às 23h30")
  })
})

describe("formatHour", () => {
  it("drops zero minutes", () => {
    expect(formatHour("18:00")).toBe("18h")
    expect(formatHour("18:30")).toBe("18h30")
    expect(formatHour("09:00")).toBe("9h")
  })
})
