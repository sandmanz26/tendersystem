# Kru: field crew app for wedding organizers

A mobile web app for wedding-organizer field crews. Front-end only: React + Vite + Tailwind v4 + shadcn/ui, with mock data saved in `localStorage` (reset it from the Profile page).

```bash
npm install
npm run dev     # http://localhost:5173
npm run build
```

## Features

| Need | Where |
|---|---|
| Many events in one app | Home: *Live*, *Upcoming*, *Done* |
| Event info | Event page, **Info** tab: location & loading notes, rundown, crew notes, key contacts, phase history |
| Item scanning per phase | Event page → **Start scan**, or the centre **Scan** button |
| Item info | **Items** tab (global inventory) or the event's Items tab → current location, condition, scan trail, bookings, report history |
| Report an issue | **Reports → Report**, or from an event |
| Report damaged/missing items | From the scanner (*Report* button), the item page, or the report form |
| Who's involved | **Team** tab: in-house crew (lead marked) + vendors, with WhatsApp/call buttons |

## Design

The UI follows the [taste-skill](https://github.com/Leonxlnx/taste-skill) app-screen rules, style **accent-ladder** (seed 1493120158). See [`docs/design-review.md`](docs/design-review.md) for the decisions and the before/after measurements.

- One raspberry hue (`--brand: #b8336a`) at full strength on small marks only: the one filled button per screen, scanned cells, the active nav icon. Its pale tints (`--brand-soft`, `--brand-track`) do the area work.
- DM Sans for everything; Geist Mono for asset IDs only.
- Surfaces are separated by a 1px border, never a resting shadow. 8px cards, 6px controls. No gradients, blur, or glows.
- The **manifest grid** (`src/components/manifest-grid.tsx`) is the product's own element: one cell per crate or pallet, filled when scanned, hatched when reported, empty while pending.

## Research & negative cases

See [`docs/research-and-negative-cases.md`](docs/research-and-negative-cases.md) for the research findings, what v0.2 added, and the full negative-case matrix.

## Phases & scan gate

`Warehouse Load-out → Venue Arrival → Setup & Decor → Event Live → Strike & Load → Warehouse Return`

Setup & Event Live each have a **checklist** that must be complete. Load-out and Return need a **warehouse admin signature**. Offline mode can be tried from Profile → *Simulate no signal*.

Scan phases (Load-out, Arrival, Strike, Return) **can't be completed** until every item on the event's manifest is scanned. Damaged or missing items can be *reported* from the scanner. That report stands in for the scan in that phase, so one broken crate doesn't hold up the whole crew, but it stays on record.

The scanner supports:
- **Camera** via `BarcodeDetector` (Chrome on Android). The button is disabled on unsupported browsers.
- **Typing the code** from the label (e.g. `KRS-TFG-01`).
- **Scan demo**: picks a random unscanned item, for presentations.

Every scan outcome is handled: success, duplicate, wrong format, unknown code, item booked for another event, item still out at another event, and skipped checkpoint.

## Structure

```
src/
  data/        types, phases, mock data (dates relative to today)
  store/       context + localStorage + offline queue
  lib/         phase progress, whereabouts, rundown, date formatting
  components/  ui/ (shadcn), shell, phase track, rows, sheets
  pages/       home, event-detail, scan, inventory, item-detail, report-*, profile
```

The shadcn components in `src/components/ui` were written by hand because the shadcn registry wasn't reachable from the build environment. The API is the same, and `components.json` is set up for future `npx shadcn add`.
