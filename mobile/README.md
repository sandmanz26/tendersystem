# EMI mobile (React Native)

The field app for **EMI – Event Management Inventory**. Built with React Native 0.77.2 and TypeScript, and aligned with the EMI web platform (PRD-TECHNICAL-SYSTEM-SCHEMA, web `main@f59524c`).

It is still front-end only. It runs on mock data seeded from the web, and the demo date is fixed at `TODAY = 2026-04-09`, the same as the web.

## What it does (v1)

| Job | Screen | Rules it follows |
|---|---|---|
| Sign in | Login | Admin / Staff / Viewer. An inactive account can't sign in. Viewer is read-only. |
| Events | Events | Six tabs: On Going, Upcoming, Ready to Close, Checking Inventory, Returned & Completed, Transferred. Has search. |
| Work an event on site | Event Detail | **Stage track:** read from Event Status, never hard-coded.<br>**Lines:** grouped by area, with tabs All / Waiting Scan / Added New / Grouped / Broken / Rented / Outsourced. |
| Scan in / out | Scanner | **Codes:** QR via VisionCamera, or typed SKU. Payloads are `emi:line:<eventId>:<lineId>`, `emi:box:<eventId>:<packageId>` and `emi:item:<SKU>`.<br>**One scan:** marks a whole line; a box scan marks every line in it.<br>**Same item on several areas:** you pick the area (never auto-picked).<br>**Direction:** first scan stage = in, later scan stage = out. |
| Next stage | Advance sheet | **Order:** ownership check → broken-item warning → confirm.<br>**Blocked:** while lines still wait for a scan.<br>**Writes off:** broken units.<br>**Stock-return stage:** returns stock and locks adding items. |
| Broken items | Line sheet | Qty ≤ line qty, a note and up to 4 photos. Can be edited or removed before the next stage. |
| Modify a line | Line sheet | Area / sub area always. Qty only when the line was added at the current stage. Delete only where `allowDelete`. |
| Rent / Outsource | Event tabs, Rentals | **Labels:** Rent = Rented / Returned. Outsource = Received / Completed. Overdue when past the due date.<br>**Receive:** adds a line to the event and never touches stock. Always the full qty. |
| Closing | Event Detail | Ready to Close → Close & Start Checking → cross-check each line → Return or Transfer (whole line, to another open event and stage) → Finalize. |
| Stock lookup | Stock, Item | Stock per warehouse with Safe / Warning / Critical, asset value, where each item is booked, and stock history. |
| Stock opname | Opname | Count a warehouse (qty, Good / Poor + note), then submit. Only one Pending opname per tenant. Admin approves → stock and ledger are written. Reject changes nothing. |
| Offline | Everywhere | Every write while offline goes into an outbox and is sent when the connection is back. Profile has an offline test mode. |

Numbers use the Indonesian style (`12.500`, `Rp1.443.680.000`). Dates follow the web (`09 Apr 2026`).

### Owner decisions assumed (to confirm)

1. QR payloads as above.
2. Scan in / out is decided by the stage, not by "first / second scan". The web lets scan-out pass unscanned.
3. Postphone and Disable are hold statuses outside the pipeline, so **Finished** is the last stage and makes an event Ready to Close.
4. Broken reports may carry photos.
5. Mobile is for Admin and crew. Viewer is read-only, and only Admin approves opname.
6. Online-first with an outbox for scans, broken reports, opname, receive / return and stage moves.

Rooftop Sunset Mixer is placed at *Waiting scan out* in the mock data (the web seed has it at Ready to Close) so scan-out can be demoed.

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Admin | dewi@emi.id | Admin@123 |
| Staff | anto@emi.id | Staff@123 |
| Viewer | rian@emi.id | Viewer@123 |

## Run

```bash
cd mobile && npm install
cd ios && bundle install && bundle exec pod install && cd ..   # iOS only
npm run ios      # or: npm run android
```

## Checks

```bash
npm run typecheck   # tsc --noEmit
npm run lint
npm test            # 42 tests: rules, store flows, every screen and tab renders
```

## Structure

```
src/core/types.ts   EMI entities (web field names)
src/core/seed.ts    mock data from the web seeds
src/core/rules.ts   business rules as pure functions (scan, Next, closing, rentals, stock, opname)
src/core/format.ts  id-ID numbers, web date shapes
src/store.tsx       state, actions, role guard, outbox, AsyncStorage
src/selectors.ts    derived event view
src/screens/        Login, Events, EventDetail, Scanner, ScanPicker, Stock, ItemDetail, Rentals, Opname, OpnameCount, OpnameDetail, Profile
src/ui/             primitives, domain parts (StageTrack, LineRow, ScanMarks), sheets
```

The design follows the EMI web tokens:
- Colours: indigo `#4f46e5` for navigation and stage moves, green `#059669` for save / received.
- Surfaces: hairline borders, radii 7 / 11 / 14.
- Data: quantities first, tabular numbers, SKUs in mono.

## Verified here, and not

- **Passed in this environment:** `tsc` and `eslint` are clean, and all 42 Jest tests pass. Release JS bundles build for android and ios.
- **Previewed:** the screens were rendered through react-native-web for screenshots.
- **Not run yet:** a real device or simulator (no Android SDK or Xcode here). Camera scanning and the photo picker still need a device test.
