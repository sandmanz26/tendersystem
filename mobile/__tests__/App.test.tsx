import * as React from "react"
import ReactTestRenderer from "react-test-renderer"

import App from "../App"
import { REPORTS } from "../src/core/mock"
import { navigationRef, type RootStackParamList } from "../src/navigation"

jest.useFakeTimers()

async function renderApp() {
  let tree: ReactTestRenderer.ReactTestRenderer
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<App />)
  })
  await ReactTestRenderer.act(async () => {
    jest.runOnlyPendingTimers()
  })
  return tree!
}

/** All rendered strings, joined; avoids serialising host props. */
const text = (tree: ReactTestRenderer.ReactTestRenderer) =>
  tree.root
    .findAll((n) => (n.type as unknown) === "Text")
    .flatMap((n) => n.children.filter((c): c is string => typeof c === "string"))
    .join(" ")

test("renders the events home once saved state is loaded", async () => {
  const tree = await renderApp()
  expect(text(tree)).toContain("Today")
  expect(text(tree)).toContain("Nadia & Raka")
})

// Every route opens without throwing, with real params and with a bad id.
const routes: [keyof RootStackParamList, object | undefined, string][] = [
  ["EventDetail", { eventId: "ev-nadia-raka" }, "Taman Arunika"],
  ["EventDetail", { eventId: "ev-nadia-raka", tab: "team" }, "Field coordinator"],
  ["EventDetail", { eventId: "nope" }, "Not found"],
  ["ItemDetail", { code: "KRS-TFG-01", eventId: "ev-nadia-raka" }, "Trail at Nadia & Raka"],
  ["ItemDetail", { code: "KRS-TFG-01" }, "Report damage"],
  ["ItemDetail", { code: "ZZZ-ZZZ-99" }, "Not found"],
  ["ReportDetail", { reportId: REPORTS[0].id }, "Activity"],
  ["ReportDetail", { reportId: "nope" }, "Not found"],
  ["Scanner", { eventId: "ev-nadia-raka" }, "Arrive"],
  ["NewReport", { type: "damage", assetCode: "KRS-TFG-01", eventId: "ev-nadia-raka" }, "Condition"],
  ["NewReport", undefined, "What happened?"],
]

test.each(routes)("opens %s %j", async (name, params, expected) => {
  const tree = await renderApp()
  await ReactTestRenderer.act(async () => {
    navigationRef.navigate(name as never, params as never)
    jest.runOnlyPendingTimers()
  })
  expect(text(tree)).toContain(expected)
})

const tabs = [
  ["Inventory", "Furniture"],
  ["ScanPicker", "Awaiting scan"],
  ["Reports", "In progress"],
  ["Profile", "Offline test mode"],
] as const

test.each(tabs)("opens the %s tab", async (tab, expected) => {
  const tree = await renderApp()
  await ReactTestRenderer.act(async () => {
    navigationRef.navigate("Tabs", { screen: tab })
    jest.runOnlyPendingTimers()
  })
  expect(text(tree)).toContain(expected)
})
