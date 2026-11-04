import { closingTab, findStage, isWaiting, linesLocked, scanMode, type ClosingTab, type ScanMode } from "./core/rules"
import { ITEMS, keyOf } from "./core/seed"
import type { EmiEvent, EventLine, Item, Package, Stage } from "./core/types"
import type { PersistedState } from "./store"

export interface EventView {
  event: EmiEvent
  key: string
  stage: Stage
  lines: EventLine[]
  packages: Package[]
  tab: ClosingTab
  mode: ScanMode | null
  waiting: number
  locked: boolean
}

/** Everything a screen needs about one event, derived; never stored. */
export function eventView(event: EmiEvent, s: Pick<PersistedState, "progress" | "lines" | "packages" | "closing">, stages: Stage[]): EventView {
  const key = keyOf(event)
  const stageName = s.progress[key] ?? [...stages].sort((a, b) => a.order - b.order)[0].status
  const stage = findStage(stages, stageName)!
  const lines = s.lines[key] ?? []
  const tab = closingTab(s.closing[key], stageName, lines.length, stages)
  const mode = tab === "on-going" ? scanMode(stages, stageName) : null
  return {
    event,
    key,
    stage,
    lines,
    packages: s.packages[key] ?? [],
    tab,
    mode,
    waiting: mode ? lines.filter((l) => isWaiting(l, mode)).length : 0,
    locked: linesLocked(tab),
  }
}

const byName = new Map(ITEMS.map((i) => [i.name, i]))
export const itemByName = (name: string): Item | undefined => byName.get(name)
export const unitOf = (name: string, fallback = "pcs") => byName.get(name)?.unit ?? fallback
