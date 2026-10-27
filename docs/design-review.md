# Design review: taste-skill pass

The UI was reworked with [taste-skill](https://github.com/Leonxlnx/taste-skill) (`design-taste-frontend`), following its **app-screen** run (`references/app-screens.md`), since Kru is a tool people work in rather than a page they read.

## Decisions

| | |
|---|---|
| Style | `accent-ladder`, kind `community`, light, seed 1493120158. Chosen because Kru is glanced at on a phone in the field, and colour has to mean something (scanned, pending, at risk), not decorate. `framed-sheet` is a desktop sidebar shell; `achromatic-ledger` is built for money screens. |
| Hue | The dealt raspberry `#b8336a`, kept: it suits a wedding organiser and replaces the generic emerald. |
| Face | The page ground tinted one level toward the hue (`#fbf7f8`), so the page and the tints read as one family. |
| Signature element | **Manifest grid**: one cell per manifest line. Filled = scanned, hatched = reported damaged/missing, amber = scanned but skipped a checkpoint, empty = still to scan. Replaces the progress rings. |
| Type | DM Sans (dealt), loaded locally so it works offline. Geist Mono kept for asset IDs only (allowed on app screens). |
| Home's question | "What do I have to do right now, and how much is left?" The largest figure on the screen (36px) is the number of items left at the current checkpoint. |

## What changed

- Shadows on every card and button → 1px borders; the only shadows left are on the dialog and the bottom sheet, which really float.
- Floating glass pill nav with a raised scan button → a plain bottom bar; one filled button per screen.
- Dark hero card ("green on black") → a white card led by the answer figure and the manifest grid.
- Seven-colour tinted icon squares on every inventory row → one grey outline icon set.
- Terracotta warning colour (failed contrast at 3.2:1) → the warning pill pair `#fffbeb` / `#92400e`.
- Gradient bottom bars → flat bars with a top border.
- Segmented tabs on the event page → underline tabs on a 1px rule (the sheet's detail pattern).
- Numbered crew notes → plain bullets (no index numbering).
- "In use" pills on most inventory rows → removed; the location is already in the subline. Only "Needs check" keeps a pill.
- Seven grey "Report" blocks down the scanner list → text actions.
- The rundown now shows where the day is: past items grey, the current one marked "Now".
- Nothing under 12px; secondary text 13px. Every grey reaches 4.5:1.
- Every screen has exactly one `h1`.
- Disabled buttons stay legible and say why ("3 tasks left before Event Live").

## Measurements

`lint.mjs --app` on `src/`:

| | FAIL | WARN |
|---|---|---|
| Before | 2 | 34 |
| After | 0 | 15 |

The 15 remaining warnings are allowed by the app rules: shadows on the dialog and bottom sheet (real overlays), zero-padding that builds clock times, and monospace on asset IDs.

`inspect.mjs --app` at 390 and 768 px:

| Screen | Before | After |
|---|---|---|
| Home | 3 FAIL, 1 WARN | 0 / 0 |
| Event detail | 2 FAIL, 2 WARN | 0 / 0 |
| Scanner | 5 FAIL, 2 WARN | 0 / 0 |
| New report | 4 FAIL, 1 WARN | 0 / 0 |
| Items | 3 FAIL, 1 WARN | 0 / 0 |
| Reports | 2 FAIL, 2 WARN | 0 / 0 |
| Item detail | 3 FAIL, 1 WARN | 0 / 0 |
| Report detail, scan picker, profile, event tabs, closed/future event, 404 | not measured before | 0 / 0 |

Before-failures were mainly: button shadow/glow, heavy panel shadows, gradients, the terracotta accent, tinted icon chips, missing `h1`, contrast under 4.5:1, and too much text under 13px.

## Round 3: critique of every screen

The meter passed everywhere after round 2, so round 3 looked at every screen and tab at 390px against the skill's app-screen questions. Fixed:

- **Event tabs buried their content.** On the Items, Team, and Reports tabs the first row sat about 740px down, under the header and phase panel. Choosing a tab (or opening a link straight to one) now scrolls the content up under the sticky top bar: the first row is now at 171-257px, inside the top 60% the phone rule asks for.
- **Red as texture.** Every "Open" report was red, and resolved reports kept a red urgency dot. Status now uses one hue at three intensities (Open = the raspberry tint, In progress = amber, Resolved = grey), and a resolved report's urgency dot is grey. Red is left for failures.
- **An empty callout.** A venue with no loading note showed a truck callout holding only "—"; it is now left out.
- **The report form defaulted to yesterday's event.** It now picks the event being worked today first.
- **The 404 page had no `h1`.**
- **The event header's meta line broke mid-phrase** ("Garden, sage & / ivory"); the theme now has its own line.

Final gate on the final code: `inspect.mjs --app` 0 FAIL / 0 WARN on 17 screen states (every screen, every event tab, a closed and a future event, item inside and outside an event, 404); `lint.mjs --app` 0 FAIL.

## Round 4: less text, same density

Goal: fewer words to read, the same information, and the common jobs one tap away.

- **Icons instead of labels.** Call time, event time, guests, venue, phase, reporter and time render as icon + value (`src/components/meta.tsx`), with a screen-reader label behind each icon.
- **An action bar for the frequent jobs** (`src/components/action-bar.tsx`) on Home and the event page: Scan, Report, call the Lead, Map.
- **Hint sentences removed:** phase hints, the scanner's camera instruction and helper paragraph, the "scan results appear here" box, the photo hint, subtitles under page titles.
- **The scanner viewfinder is the camera button,** and scan results show on top of it. Row "Report" text became a flag icon button. Result messages are a few words each ("Still out", "Wrong event · Don't load").
- **Inventory status as count tiles** (All, Out, In, Check) that filter the list; categories became section headers instead of a second control row.
- **Item facts as icon tiles** instead of a 4-row table; report details as one icon row under the title.
- **The report form asks for less:** no title field (it is built from the category and item, or the first words of the description), the type is one icon and one word, and a damage note is optional.

Taps to the frequent jobs, from Home:

| Job | Before | After |
|---|---|---|
| Scan the live event | 1 | 1 |
| Report a problem | 2 (Reports → Report) | 1 |
| Call the event lead | 3+ (event → Info tab → scroll to contacts) | 1 |
| Open the venue in Maps | 3 (event → Info tab → Open Maps) | 1 |

Visible words (first screen / whole page) at 390px:

| Screen | Before | After |
|---|---|---|
| Home | 92 / 107 | 90 / 93 |
| Event detail | 85 / 237 | 94 / 217 |
| Scanner | 70 / 114 | 55 / 68 |
| Items | 96 / 263 | 90 / 302 |
| Item detail | 66 / 66 | 54 / 54 |
| Report detail | 87 / 91 | 86 / 86 |
| New report | 49 / 62 | 36 / 36 |
| Profile | 62 / 67 | 47 / 52 |

The event page's first screen holds more words because more of the page now fits on it: the header, actions, Now/Next, the phase and the tabs, where the tabs used to start below the fold. Items has more words in total because each category now has a header.

`inspect.mjs --app`: 0 FAIL / 0 WARN on 19 screen states. `lint.mjs --app`: 0 FAIL.

## Not covered

- The inspector's desktop width (1440) was skipped: Kru is a phone app shown in a 440px column on larger screens.
- Sample data (people, venues, assets, reports) is still mock data in `src/data/mock.ts` and must be replaced with real data.
