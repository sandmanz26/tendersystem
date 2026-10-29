# Kru: feature list and technical spec

Status: front-end prototype (v0.2), mock data only, no backend. Written against commit `3d62665`.

## 1. Product summary

Kru is a mobile web app for a wedding organiser's field crew. It walks one crew member through every event they are assigned to, from loading the truck at the warehouse to bringing every item back, and makes it hard to lose an item on the way: each scan checkpoint must be complete before the event can move on.

| | |
|---|---|
| Users | Field crew (logistics, decor, sound & lighting, drivers, runners). Coordinators appear as leads and as people who answer reports; they have no screens of their own yet. |
| Device | Phone, one-handed, often outdoors or in a basement with no signal. |
| Core promise | No item goes missing between warehouse and venue and back. |
| Language | English UI; dates in day-month order (`en-GB`). |

## 2. Features

### 2.1 Events (home)

- **Live event card.** The most urgent live event: couple, venue, start time, items left to scan (the largest figure on screen), the manifest grid, the six-phase tracker, and the next rundown item with a countdown.
- **Action bar.** One tap to Scan, Report, call the event lead, or open the venue in Maps.
- **Also live.** Other events in progress (e.g. yesterday's event still being unloaded).
- **Schedule.** Upcoming and done events with date, call time and crew size.
- An event is *live* when it is not closed and it is today or earlier, or its first phase has started (H-1 load-out).

### 2.2 Event detail

- **Header:** date block, couple, call time, event time, guest count.
- **Action bar** (assigned crew only): Scan, Report, Lead, Map.
- **Now / Next** from the rundown, refreshed every minute, on the event day only.
- **Phase panel:** current phase, step count, items left, manifest grid, checklist (for Setup and Event Live), and the button that closes the phase.
- **Tabs:**
  - *Info:* venue (tap for Maps), loading note, theme, rundown with past / now / upcoming marked, crew notes, key contacts (lead, client, venue) with WhatsApp and call, phase history with handover signatures.
  - *Items:* search, filters (All / Left / Flagged), items grouped by category with their scan state.
  - *Team:* crew with duty and lead marked, vendors, WhatsApp and call per person.
  - *Reports:* reports for this event, with shortcuts to a new issue or damage report.
- Choosing a tab, or opening a link straight to one, scrolls its content up under the top bar.
- Someone not on the crew sees the event read-only.

### 2.3 Phases and gates

Every event moves through six phases in order:

| # | Phase | Short | Gate to close it |
|---|---|---|---|
| 1 | Warehouse Load-out | Load | Every item scanned or reported, **plus a signed handover** by the warehouse admin |
| 2 | Venue Arrival | Arrive | Every item scanned or reported |
| 3 | Setup & Decor | Setup | 6-item checklist complete |
| 4 | Event Live | Event | 3-item checklist complete |
| 5 | Strike & Load | Strike | Every item scanned or reported |
| 6 | Warehouse Return | Return | Every item scanned or reported, **plus a signed handover** |

- A damage or missing report filed in a phase counts as recorded for that phase, so one broken crate does not block the crew, but it stays on record.
- Closing a phase is confirmed in a bottom sheet (counts of scanned / reported / flagged), cannot be undone from the app, and is re-checked in the store at the moment of closing (guards against a stale button or a double tap).
- After phase 6 the event is closed.

### 2.4 Scanner

- **Input:** the camera via the browser's `BarcodeDetector` (QR, Code 128, Code 39, EAN-13; Chrome on Android), typing the code from the label, or *Scan demo* for presentations. The viewfinder itself is the camera switch.
- **Feedback** on top of the viewfinder, plus a distinct sound and vibration for success and failure; sound can be muted.
- **Undo** a successful scan for 8 seconds.
- **Lists:** items left and items done, each with its state; a flag button on each pending item opens a damage report for it.
- **Validation order** for every scan (first failing check wins):

| # | Check | Outcome when it fails |
|---|---|---|
| 0 | Code is normalised: upper case, spaces/underscores → `-` | — |
| 1 | User is on this event's crew | Blocked: not assigned |
| 2 | Current phase needs scanning | Blocked: no scan in this phase |
| 3 | Format is `AAA-AAA-00` | Wrong format |
| 4 | Code is on this event's manifest | Known asset → *Wrong event* (names the event it is booked for); otherwise *Unknown code* |
| 5 | Not already scanned in this phase | *Already scanned* (who and when) |
| 6 | Load-out only: the item is not still out at another event | *Still out* (names the event) |
| ✓ | Recorded | Flagged if the item skipped the previous scan checkpoint; a heads-up if the item is marked *Needs check* |

### 2.5 Items (inventory)

- Search by name, code or rack.
- Status tiles that filter and count: All / Out (at an event) / In (warehouse) / Check (condition not Good).
- Grouped by category; each row shows the code and where the item is right now.
- **Item detail:** code, category, condition, current location (warehouse spot, or the event and when it left), care notes, facts (per scan, spot, size, last checked), the scan trail at the current event, bookings, report history, and a *Report damage* button.
- *Where an item is* is derived from scans: out from its load-out scan until its return scan.

### 2.6 Reports

- **Two kinds:** *Issue* (Venue, Vendor, Transport, Client, Crew, Security, Other) and *Damage* (Minor damage, Major damage, Missing, Short count) tied to one item.
- **Form:** event (defaults to today's live event), item (damage), category/condition, up to 4 photos (camera or gallery), urgency (Low / Medium / High), details. No title field: the title is built from the item and condition, or from the first words of the description.
- **High urgency** shows a direct call button for the event lead.
- **List** with filters All / Open / In progress / Resolved / Mine, each with a count.
- **Detail:** status, urgency, kind, the photos (tap to enlarge), the item, an activity thread, adding updates, marking resolved; an update on a resolved report reopens it.
- **Status colours:** Open = the brand tint, In progress = amber, Resolved = grey. Red is kept for failures.

### 2.7 Offline and sync

- Scans, reports and report updates made offline are saved with `synced: false` and marked *queued*.
- A banner shows offline state and the queue size; it turns into *Syncing…* once online.
- The queue is pushed automatically about 1.5 s after the connection returns (simulated in this prototype).
- Online state = the browser's `navigator.onLine` AND not the *Offline test mode* switch on the Profile page.

### 2.8 Profile

- Name, role, counts (events, scans, reports), sync state, *Offline test mode*, account details, past events.
- *Reset demo data* (confirmed; warns if unsent data would be lost). *Sign out* warns while data is still queued.

### 2.9 Negative cases

All handled cases (scanning, phases, reports, system) are listed in [`research-and-negative-cases.md`](research-and-negative-cases.md).

## 3. Technical spec

### 3.1 Stack

| Layer | Choice | Version |
|---|---|---|
| UI | React | 19.3.1 |
| Language | TypeScript (strict, `noUnusedLocals`) | 6.0.3 |
| Build / dev server | Vite (`@vitejs/plugin-react`) | 8.3.4 |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`), CSS variables as design tokens | 4.3.3 |
| Components | shadcn/ui pattern (copied into `src/components/ui`), Radix primitives (`radix-ui`), `vaul` drawers | radix-ui 1.8.1, vaul 1.1.2 |
| Routing | React Router (`HashRouter`) | 7.18.4 |
| Icons | lucide-react | 1.60.0 |
| Toasts | sonner | 2.0.8 |
| Fonts | DM Sans Variable, Geist Mono Variable (self-hosted via Fontsource) | 5.3.0 |
| Lint | oxlint | 1.88.x |

No backend, no external API calls, no analytics.

### 3.2 Project structure

```
src/
  main.tsx, App.tsx        entry, routes, toaster
  data/
    types.ts               domain types
    phases.ts              the six phases, checklists, handover rules
    mock.ts                people, assets, events, scans, phase log, reports
  store/app-store.tsx      React context: state, actions, persistence, offline queue
  lib/
    progress.ts            phase progress and gates (pure functions)
    whereabouts.ts         where an asset is, from the scan trail
    rundown.ts             now / next from the rundown
    format.ts, lookup.ts   dates, links, lookups by id
  hooks/use-barcode-camera.ts   camera stream + BarcodeDetector loop
  components/              shell, top bar, manifest grid, action bar, meta, rows, sheets, signature pad
  components/ui/           shadcn components (button, badge, tabs, drawer, dialog, …)
  pages/                   one file per screen
docs/                      research, design review, this spec
```

About 5,800 lines of TypeScript across 51 files.

### 3.3 Routes

`HashRouter`, so the build can be served from any static host without rewrite rules.

| Route | Screen |
|---|---|
| `/` | Events (home) |
| `/event/:id?tab=info\|items\|team\|reports` | Event detail |
| `/event/:eventId/items/:code` | Item, in the context of an event |
| `/items` | Inventory |
| `/items/:code` | Item detail |
| `/scan` | Pick an event to scan |
| `/scan/:eventId` | Scanner (full screen, no tab bar) |
| `/new-report?event=&type=issue\|damage&asset=` | New report (full screen) |
| `/reports` | Reports list |
| `/reports/:id` | Report detail |
| `/profile` | Profile |
| `*` | Not found |

### 3.4 Data model

Defined in `src/data/types.ts`. The main entities:

| Entity | Key fields |
|---|---|
| `WeddingEvent` | `id`, `couple`, `kind`, `date`, `callTime`, `startTime`, `endTime`, `guests`, `theme`, `venue` (name, address, loading note, contact), `client`, `notes[]`, `assetCodes[]` (the manifest), `crew[]` (person, duty, lead), `rundown[]`, `phaseIndex` |
| `Asset` | `code` (`AAA-AAA-00`, printed on the QR label), `name`, `category`, `unit` (what one scan covers, e.g. "1 pallet · 40 chairs"), `location`, `condition`, `dimensions`, `lastChecked`, `notes` |
| `Person` | `id`, `name`, `role`, `phone`, `company` (vendors) |
| `ScanBook` | `scans[eventId][phaseKey][assetCode] = { at, by, synced, skippedPrevious }` |
| `Report` | `id` (`RPT-0000`), `eventId`, `kind`, `category`, `assetCode`, `phase`, `severity`, `title`, `description`, `photos[]` (JPEG data URLs), `status`, `createdAt`, `by`, `updates[]`, `synced` |
| `PhaseLogEntry` | `phase`, `at`, `by`, `handover` (`name`, `party`, `signature` as PNG data URL) |
| `TaskBook` | `tasks[eventId][phaseKey] = ticked task labels` |

Mock dataset: 6 events, 33 assets, 18 people (14 crew, 4 vendors), 4 reports. Dates are relative to today so the demo always has a live event.

### 3.5 State and persistence

- One React context (`AppStoreProvider`) holds the persisted state: `phaseIndex`, `scans`, `phaseLog`, `reports`, `tasks`, `forceOffline`, `lastSyncAt`.
- Static data (events, assets, people) is imported from `mock.ts`; only what the crew changes is persisted.
- **Actions:** `scan`, `undoScan`, `toggleTask`, `advancePhase`, `addReport`, `addReportUpdate`, `setForceOffline`, `reset`.
- `scan()` returns its result synchronously (a discriminated union, 8 outcomes) so the scanner can give feedback instantly; a ref mirrors the latest state for this.
- Progress, gates and whereabouts are **derived** with pure functions (`lib/progress.ts`, `lib/whereabouts.ts`), never stored.
- **Persistence:** `localStorage`, key `kru:state:v3`, written on every change. Corrupt or missing data falls back to the seed; a full storage shows a toast and the app keeps running in memory. The key is versioned: a change to stored values bumps it.

### 3.6 Device APIs

| API | Use | Fallback |
|---|---|---|
| `BarcodeDetector` + `getUserMedia` (rear camera) | Camera scanning, polled every 250 ms; the same code is ignored for 2.5 s | Typed entry; the viewfinder shows "Type the code" |
| `navigator.vibrate` | Haptic feedback per scan outcome | Silent |
| Web Audio | Success / error tones | Silent (sound can be muted) |
| Canvas | Photo compression (longest side 960 px, JPEG 0.72); finger signature (PNG) | — |
| `online` / `offline` events | Offline banner and queue | — |
| `tel:` and `wa.me` links, Google Maps search URL | Call, WhatsApp, navigate | — |

Camera scanning needs a secure context (HTTPS or localhost).

### 3.7 Design system

- Follows the [taste-skill](https://github.com/Leonxlnx/taste-skill) app-screen rules, style *accent-ladder*: one raspberry hue (`#b8336a`) on small marks, its tints on areas, ground `#fbf7f8`, 1px borders instead of resting shadows, 8 px cards / 6 px controls, no gradients or blur.
- Type: DM Sans; Geist Mono for asset codes only. Nothing under 12 px; every text colour reaches 4.5:1.
- Tokens live in `src/index.css` (`:root` + `@theme inline`), consumed through Tailwind classes.
- Product-specific components: `ManifestGrid` (one cell per manifest line), `PhaseTrack`, `ActionBar`, `Meta`, `PhaseCompleteSheet`, `SignaturePad`, `SyncStatus`.
- Decisions and measurements: [`design-review.md`](design-review.md).

### 3.8 Build and size

| | |
|---|---|
| Commands | `npm run dev`, `npm run build` (`tsc -b && vite build`), `npm run lint` |
| JS bundle | 549 kB, **167 kB gzip** (one chunk) |
| CSS | 46 kB, 9 kB gzip |
| Fonts | Latin subsets 37 kB (DM Sans) + 23 kB (Geist Mono), plus other subsets loaded only if needed |
| Output | Static files in `dist/`; any static host works (hash routing) |

### 3.9 Quality checks used

- TypeScript build with no errors; oxlint with no errors.
- An end-to-end Playwright run at 390 × 844 covering every scan outcome, undo, offline queue and sync, phase close with checklist and signed handover, report validation, report submit, with no console errors.
- taste-skill `inspect.mjs --app` (0 FAIL / 0 WARN on 19 screen states at 390 and 768 px) and `lint.mjs --app` (0 FAIL).
- There is no automated test suite in the repo yet.

## 4. Limits of the prototype

- **No backend:** data lives in one browser. Two phones never see each other's scans.
- **No login or roles:** the user is fixed (`p01`, Dimas Prasetyo). Coordinators cannot answer reports from their own screen.
- **Sync is simulated:** "syncing" only flips the `synced` flag.
- **Photos in `localStorage`:** a few photos fill the quota (about 5 MB).
- **One JS chunk of 167 kB gzip:** fine for now; split per route as screens grow.
- **Not a PWA yet:** no service worker, so the app shell itself needs a connection to load the first time.

## 5. Toward production

A suggested path, in order of value:

1. **Backend and API** (the server becomes the source of truth):

   | Method | Endpoint | Purpose |
   |---|---|---|
   | `GET` | `/me/events` | Events assigned to the signed-in crew member, with manifest, crew, rundown, phase |
   | `GET` | `/assets/:code` | Asset detail, whereabouts, bookings, reports |
   | `POST` | `/events/:id/scans` | Batch of `{ code, phase, at, clientId }`; idempotent by `clientId`; returns per-scan outcome |
   | `DELETE` | `/events/:id/scans/:clientId` | Undo within the window |
   | `POST` | `/events/:id/phases/:phase/close` | Close with optional handover (name + signature); server re-checks the gate |
   | `PUT` | `/events/:id/tasks/:phase` | Checklist state |
   | `POST` | `/reports` | New report (photos uploaded first, referenced by URL) |
   | `POST` | `/reports/:id/updates` | Update and/or status change |

   The scan validation in §2.4 moves to the server; the client keeps a copy for instant feedback and accepts the server's verdict on sync. Conflicts (two phones scanning the same item) are resolved by first write wins, with the second shown as *Already scanned*.
2. **Auth and roles:** crew, coordinator (answers reports, reopens phases), warehouse admin (signs handovers).
3. **Real offline:** a service worker for the app shell, IndexedDB for the queue and photos, background sync.
4. **Coordinator view:** all live events, open reports, missing items.
5. **Label printing:** QR labels generated from the asset register.
6. **Per-unit counts** at strike (e.g. 36 glasses in a crate) in addition to the crate scan.
7. **Tests:** unit tests for `lib/progress.ts`, `lib/whereabouts.ts` and the scan validation; the Playwright run checked into the repo.
