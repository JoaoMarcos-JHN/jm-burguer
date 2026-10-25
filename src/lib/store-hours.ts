import type { OpeningShift } from "@/lib/menu/types"

const MINUTES_PER_DAY = 24 * 60
const MINUTES_PER_WEEK = 7 * MINUTES_PER_DAY

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
}

const WEEKDAY_NAMES = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"]

export type StoreStatus =
  | { isOpen: true; closesAt: string }
  | {
      isOpen: false
      /** null when there are no hours, or the owner closed the store for now. */
      nextOpening: { daysFromNow: number; weekday: number; opensAt: string } | null
    }

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

function toTime(minutes: number): string {
  const m = ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`
}

/** Minutes since Sunday 00:00, in the store's timezone (not the visitor's). */
export function minutesIntoWeek(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date)

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ""
  return (
    WEEKDAY_INDEX[get("weekday")] * MINUTES_PER_DAY +
    Number(get("hour")) * 60 +
    Number(get("minute"))
  )
}

/** A shift as [start, end) in minutes into the week. end may pass the week's end. */
function shiftRange(shift: OpeningShift): [number, number] {
  const opens = toMinutes(shift.opensAt)
  const closes = toMinutes(shift.closesAt)
  const start = shift.weekday * MINUTES_PER_DAY + opens
  const duration = closes > opens ? closes - opens : closes + MINUTES_PER_DAY - opens
  return [start, start + duration]
}

export function getStoreStatus(
  hours: OpeningShift[],
  now: Date,
  timeZone: string,
  isTemporarilyClosed = false,
): StoreStatus {
  if (isTemporarilyClosed) return { isOpen: false, nextOpening: null }

  const current = minutesIntoWeek(now, timeZone)

  for (const shift of hours) {
    const [start, end] = shiftRange(shift)
    // A Saturday shift that runs past midnight is still open early on Sunday,
    // which is the start of the next week: check that wrap too.
    for (const at of [current, current + MINUTES_PER_WEEK]) {
      if (start <= at && at < end) return { isOpen: true, closesAt: toTime(end) }
    }
  }

  let best: { delta: number; shift: OpeningShift } | null = null
  for (const shift of hours) {
    const [start] = shiftRange(shift)
    const delta = (((start - current) % MINUTES_PER_WEEK) + MINUTES_PER_WEEK) % MINUTES_PER_WEEK
    if (!best || delta < best.delta) best = { delta, shift }
  }
  if (!best) return { isOpen: false, nextOpening: null }

  const daysFromNow =
    Math.floor((current + best.delta) / MINUTES_PER_DAY) - Math.floor(current / MINUTES_PER_DAY)
  return {
    isOpen: false,
    nextOpening: { daysFromNow, weekday: best.shift.weekday, opensAt: best.shift.opensAt },
  }
}

/** "18:00" -> "18h", "18:30" -> "18h30" */
export function formatHour(time: string): string {
  const [hours, minutes] = time.split(":")
  return minutes === "00" ? `${Number(hours)}h` : `${Number(hours)}h${minutes}`
}

/** "Abrimos quinta às 18h", or null when there is no opening to announce. */
export function describeNextOpening(status: StoreStatus): string | null {
  if (status.isOpen || !status.nextOpening) return null
  const { daysFromNow, weekday, opensAt } = status.nextOpening
  const day = daysFromNow === 0 ? "hoje" : daysFromNow === 1 ? "amanhã" : WEEKDAY_NAMES[weekday]
  return `Abrimos ${day} às ${formatHour(opensAt)}`
}

/** One sentence about whether an order can go out now. */
export function describeStoreStatus(status: StoreStatus): string {
  if (status.isOpen) return `Aberto até ${formatHour(status.closesAt)}`
  const next = describeNextOpening(status)
  return next ? `Fechado agora. ${next}` : "Fechado no momento"
}

const SHORT_DAY_NAMES = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"]
// Weeks on a shop door start on Monday.
const DOOR_ORDER = [1, 2, 3, 4, 5, 6, 0]

function dayRuns(days: Set<number>): string[] {
  const runs: number[][] = []
  for (const day of DOOR_ORDER) {
    if (!days.has(day)) continue
    const last = runs.at(-1)
    const previous = last ? DOOR_ORDER.indexOf(last.at(-1)!) : -2
    if (last && DOOR_ORDER.indexOf(day) === previous + 1) last.push(day)
    else runs.push([day])
  }
  return runs.map((run) => {
    const names = run.map((d) => SHORT_DAY_NAMES[d])
    if (names.length >= 3) return `${names[0]} a ${names.at(-1)}`
    return names.join(" e ")
  })
}

/** The opening hours as written on the door: "Qui a dom, 18h às 23h". */
export function summarizeHours(hours: OpeningShift[]): string {
  const byTime = new Map<string, Set<number>>()
  for (const shift of hours) {
    const key = `${formatHour(shift.opensAt)} às ${formatHour(shift.closesAt)}`
    byTime.set(key, (byTime.get(key) ?? new Set()).add(shift.weekday))
  }
  const text = [...byTime]
    .map(([time, days]) => {
      const runs = dayRuns(days)
      const list = runs.length > 1 ? `${runs.slice(0, -1).join(", ")} e ${runs.at(-1)}` : runs[0]
      return `${list}, ${time}`
    })
    .join("; ")
  return text.charAt(0).toUpperCase() + text.slice(1)
}
