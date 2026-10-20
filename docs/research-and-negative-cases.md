# Feature research & negative cases: Kru v0.2

## Research findings (summary)

| Source | Finding | Applied in Kru |
|---|---|---|
| Event rental apps (Rentman, RentalWorks QuikScan, Sortly, InventoryCloud) | Scan every item on the way **out** and on the way **back**. Flag damage from the app, with photos. Keep an audit trail of who scanned what. Use a **digital signature** as proof of handover. | Scan gate at 4 checkpoints. Report damage from the scanner with photos. Per-phase scan trail (time + name). Warehouse admin signs when items leave and come back. |
| Warehouse scanning practice (offline-first) | A scan should feel instant (<300 ms) and be **validated on the device**. Store scans locally **in order**, then sync. Sync status must be visible. The network should never slow the crew down. | Local validation, sound + vibration per outcome. Offline queue with a status banner and "queued" markers. Automatic sync when back online. "Simulate no signal" switch for practice. |
| Wedding day-of apps | A "**now / next**" view of the rundown, checklists per moment, backup contacts within easy reach. | Now/Next cards, Setup & Event checklists that gate the phase, key contacts on the Info tab. |

Note: most sources are vendor pages. Treat them as pattern references, not settled standards.

## What v0.2 added

1. **Offline mode + sync queue.** Venues often have no signal (ballroom basements, gardens).
2. **Undo scan** (8 seconds after a scan), for mis-scans.
3. **Checklists** in Setup & Event Live. The phase can't continue until everything is ticked.
4. **Signed handover** at Warehouse Load-out and Warehouse Return.
5. **Item whereabouts** (in the warehouse / at which event) + item bookings.
6. Global **Items tab**: search the inventory by name, code, or rack.
7. **Now / Next** from the rundown on the event day.
8. New UI: grouped cards, segmented tabs, progress rings, floating tab bar with a centre Scan button, Geist font.

## Negative-case matrix

### Scanning
| Case | Behaviour |
|---|---|
| Code not in the inventory | Red + error tone: "Unknown code, the label may be damaged" + Report button |
| Wrong code format (`hello`) | "Wrong code format" + an example |
| Lowercase / spaces (`krs tfc 01`) | Normalised automatically → `KRS-TFC-01` |
| Item belongs to another event (wrong load) | Red: "booked for [event], don't load it" |
| Item **still out at another event** during load-out | Blocked: "hasn't come back from [event]" (double booking / swapped label) |
| Duplicate scan | Grey: "already recorded at X by Y". Not counted twice |
| Skipped checkpoint (arrived at venue but never scanned at load-out) | Still recorded, but flagged yellow and shown in the phase-close summary |
| Loading an item marked "Needs check" | Yellow + the condition note |
| Mis-scan | **Undo** button for 8 seconds |
| Item missing / damaged / short | Report button per item. The report stands in for the scan so the crew isn't blocked, but it stays on record |
| Camera denied / browser unsupported | Clear message, manual entry still works |
| Camera left on when leaving the page | Stream stops on unmount / when the close-phase sheet opens |
| Not on the event's crew | Scanner blocked. Event page shows a read-only banner |
| Phase without scanning / closed event | Explanation screen + back to the event |
| Loading for an event more than a day away | Reminder: "make sure it's the right event" |

### Phases
| Case | Behaviour |
|---|---|
| Items still unscanned | Continue button disabled, showing "N items to go" |
| Checklist incomplete | Continue button disabled |
| Handover without name / signature | Button disabled. A dot or tap doesn't count as a signature |
| Stale button (data changed, double tap) | The store re-checks the gate. If it fails → toast, phase unchanged |
| Already-closed phase | Can't be reopened from the app (confirmed before closing) |

### Reports
| Case | Behaviour |
|---|---|
| Required fields empty | Marked red per field + toast |
| Description too short / long | Min 10, max 500 characters, with a counter |
| Same item already reported in this phase | Notice + link to the existing report (avoids duplicates) |
| Not an image / >15 MB / unreadable | Rejected with a per-file message |
| More than 4 photos | Extras rejected with a message |
| Double submit | Button locked while submitting |
| Leaving with a filled form | "Discard this report?" dialog + browser warning on reload / tab close |
| Offline | Report saved & sent automatically, marked "queued" |
| Event already closed | Can still report for the record, with a note |
| High urgency | Direct call button to the coordinator |
| Update on a resolved report | Reopens it as In progress |

### System
| Case | Behaviour |
|---|---|
| Browser storage full (photos) | Warning toast, the app keeps running in memory |
| Corrupt saved data | Falls back to the seed data |
| Sign out / reset with unsent data | Warned first |
| Users with reduced motion | Animations turned off |

## Not done yet (needs a backend)
- Multi-device conflicts (two crew scanning the same item at once): needs a server as the source of truth.
- Login, roles (crew vs coordinator), and coordinator approval of reports.
- Push notifications when a report gets a reply.
- Per-unit counts (e.g. 36 glasses per crate) at teardown, and printing QR labels from the app.
