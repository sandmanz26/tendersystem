import * as React from "react"
import ReactTestRenderer from "react-test-renderer"

import App from "../App"
import { EVENTS, keyOf } from "../src/core/seed"
import { navigationRef, type RootStackParamList } from "../src/navigation"

jest.useFakeTimers()

let tree: ReactTestRenderer.ReactTestRenderer

/** All rendered strings, joined; avoids serialising host props. */
const text = () =>
  tree.root
    .findAll((n) => (n.type as unknown) === "Text")
    .flatMap((n) => n.children.filter((c): c is string => typeof c === "string"))
    .join(" ")

async function renderApp(signIn = true) {
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<App />)
  })
  await ReactTestRenderer.act(async () => {
    jest.runOnlyPendingTimers()
  })
  if (signIn) {
    const anto = tree.root.findAll((n) => n.props.accessibilityLabel === "Sign in as Anto, Staff" && n.props.onPress)[0]
    await ReactTestRenderer.act(async () => {
      anto.props.onPress()
      jest.runOnlyPendingTimers()
    })
  }
}

const key = (code: string) => keyOf(EVENTS.find((e) => e.code === code)!)

test("starts at sign in, then lands on events", async () => {
  await renderApp(false)
  expect(text()).toContain("Sign in")
  const anto = tree.root.findAll((n) => n.props.accessibilityLabel === "Sign in as Anto, Staff" && n.props.onPress)[0]
  await ReactTestRenderer.act(async () => {
    anto.props.onPress()
  })
  expect(text()).toContain("Events")
  expect(text()).toContain("Engagement Rina & Bayu")
})

const routes: [keyof RootStackParamList, object | undefined, string][] = [
  ["EventDetail", { eventKey: key("PPK") }, "Waiting scan in"],
  ["EventDetail", { eventKey: key("HFB") }, "Finalize"],
  ["EventDetail", { eventKey: key("BSA") }, "View only"],
  ["EventDetail", { eventKey: "nope" }, "Not found"],
  ["Scanner", { eventKey: key("PPK") }, "SCAN IN"],
  ["Scanner", { eventKey: key("RSM") }, "SCAN OUT"],
  ["Scanner", { eventKey: key("ERB") }, "doesn't need scanning"],
  ["ItemDetail", { name: "Tiffany Chair" }, "On events"],
  ["ItemDetail", { name: "nope" }, "Not found"],
  ["Rentals", undefined, "Overdue"],
  ["OpnameCount", { warehouse: "Warehouse C9" }, "to report"],
  ["OpnameDetail", { id: 1 }, "Approved"],
]

test.each(routes)("opens %s %j", async (name, params, expected) => {
  await renderApp()
  await ReactTestRenderer.act(async () => {
    navigationRef.navigate(name as never, params as never)
    jest.runOnlyPendingTimers()
  })
  expect(text()).toContain(expected)
})

const tabs = [
  ["ScanPicker", "At a scan stage"],
  ["Stock", "Asset value"],
  ["Opname", "Count a warehouse"],
  ["Profile", "Offline test mode"],
] as const

test.each(tabs)("opens the %s tab", async (tab, expected) => {
  await renderApp()
  await ReactTestRenderer.act(async () => {
    navigationRef.navigate("Tabs", { screen: tab })
    jest.runOnlyPendingTimers()
  })
  expect(text()).toContain(expected)
})
