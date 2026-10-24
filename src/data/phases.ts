import type { Phase } from "./types"

export const PHASES: Phase[] = [
  {
    key: "load_out",
    label: "Warehouse Load-out",
    short: "Load",
    requiresScan: true,
    hint: "Scan every item as it goes onto the truck.",
    handover: { party: "Warehouse admin", hint: "The warehouse admin signs off the items leaving." },
  },
  {
    key: "arrive",
    label: "Venue Arrival",
    short: "Arrive",
    requiresScan: true,
    hint: "Scan items as they are unloaded at the venue.",
  },
  {
    key: "setup",
    label: "Setup & Decor",
    short: "Setup",
    requiresScan: false,
    hint: "Finish the setup checklist before moving on.",
    tasks: [
      "Tables & chairs match the floor plan",
      "Stage and backdrop installed securely",
      "Sound & lighting tested",
      "Cables tidied and taped down",
      "Guest area clear of boxes & plastic",
      "Setup photos sent to the coordinator",
    ],
  },
  {
    key: "show",
    label: "Event Live",
    short: "Event",
    requiresScan: false,
    hint: "Stand by according to the rundown.",
    tasks: [
      "All crew standing by at their posts",
      "Fragile items rechecked after the event",
      "Last guest has left the venue",
    ],
  },
  {
    key: "load_in",
    label: "Strike & Load",
    short: "Strike",
    requiresScan: true,
    hint: "Scan every item as it is loaded back onto the truck.",
  },
  {
    key: "return",
    label: "Warehouse Return",
    short: "Return",
    requiresScan: true,
    hint: "Scan items as they come back into the warehouse. Report damage right away.",
    handover: { party: "Warehouse admin", hint: "The warehouse admin signs off the items received back." },
  },
]

/** The scan phase before `index`, used to spot items that skipped a checkpoint. */
export function previousScanPhase(index: number) {
  for (let i = index - 1; i >= 0; i--) if (PHASES[i].requiresScan) return PHASES[i]
  return undefined
}
