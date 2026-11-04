import * as React from "react"
import ReactTestRenderer from "react-test-renderer"

import { EVENTS, keyOf } from "../src/core/seed"
import { AppStoreProvider, useAppStore } from "../src/store"
import { ToastProvider } from "../src/ui/toast"

jest.useFakeTimers()

type Store = ReturnType<typeof useAppStore>
let store: Store
function Probe() {
  store = useAppStore()
  return null
}

async function mount() {
  await ReactTestRenderer.act(async () => {
    ReactTestRenderer.create(
      <ToastProvider>
        <AppStoreProvider>
          <Probe />
        </AppStoreProvider>
      </ToastProvider>
    )
  })
}
const act = (fn: () => void) => ReactTestRenderer.act(fn)
const key = (code: string) => keyOf(EVENTS.find((e) => e.code === code)!)

test("login refuses wrong and inactive accounts", async () => {
  await mount()
  expect(store.login("dewi@emi.id", "nope")).toMatch(/Wrong/)
  expect(store.login("budi@emi.id", "Staff@123")).toMatch(/deactivated/)
  act(() => { store.login("anto@emi.id", "Staff@123") })
  expect(store.user?.role).toBe("Staff")
})

test("viewer can't change anything", async () => {
  await mount()
  act(() => { store.login("rian@emi.id", "Viewer@123") })
  act(() => { store.scan(key("PPK"), "emi:line:98:2") })
  expect(store.lines[key("PPK")].find((l) => l.id === 2)?.scanIn).toBeNull()
})

test("scan in everything, then move to Event running", async () => {
  await mount()
  act(() => { store.login("anto@emi.id", "Staff@123") })
  const k = key("PPK")
  for (const code of ["emi:line:98:2", "emi:line:98:3", "emi:box:98:1", "emi:line:98:7", "emi:line:98:8"]) act(() => { store.scan(k, code) })
  expect(store.lines[k].every((l) => l.scanIn)).toBe(true)
  act(() => { store.advance(k) })
  expect(store.progress[k]).toBe("Event running")
  // Broken roll written off on the move.
  expect(store.lines[k].find((l) => l.id === 7)).toMatchObject({ qty: 2, brokenWrittenOff: 1 })
})

test("receiving a rental adds a line, never stock", async () => {
  await mount()
  act(() => { store.login("anto@emi.id", "Staff@123") })
  const rowsBefore = JSON.stringify(store.rows)
  const k = key("IDU")
  const n = store.lines[k].length
  act(() => store.receiveRental(2))
  expect(store.lines[k]).toHaveLength(n + 1)
  expect(store.lines[k].at(-1)).toMatchObject({ name: "Gold Charger Plate", fromLoan: true, ownership: "Outsource", warehouseItem: false })
  expect(JSON.stringify(store.rows)).toBe(rowsBefore)
})

test("opname: one pending at a time, admin approval writes stock and the ledger", async () => {
  await mount()
  act(() => { store.login("anto@emi.id", "Staff@123") })
  const row = store.rows.find((r) => r.warehouseName === "Warehouse C9")!
  const line = { rowId: row.id, name: row.name, before: row.itemStock, after: row.itemStock - 1, diff: -1, condition: "Good" as const, note: "", valuation: row.valuation }
  act(() => { store.submitOpname("Warehouse C9", [line], 4) })
  let second: unknown
  act(() => { second = store.submitOpname("Warehouse C9", [line], 4) })
  expect(second).toBeNull()
  const id = store.opnames[0].id
  act(() => store.resolveOpname(id, true)) // staff: refused
  expect(store.opnames[0].status).toBe("Pending")
  act(() => store.logout())
  act(() => { store.login("dewi@emi.id", "Admin@123") })
  act(() => store.resolveOpname(id, true))
  expect(store.opnames[0].status).toBe("Approved")
  expect(store.rows.find((r) => r.id === row.id)?.itemStock).toBe(row.itemStock - 1)
  expect(store.movements[0]).toMatchObject({ reason: "Stock opname", change: -1, note: `Opname #${id}` })
})

test("closing: return every line, then finalize", async () => {
  await mount()
  act(() => { store.login("anto@emi.id", "Staff@123") })
  const k = key("HFB")
  for (const l of store.lines[k].filter((x) => !x.resolution)) act(() => store.returnLine(k, l.id))
  let result: unknown
  act(() => { result = store.finalize(k) })
  expect(result).toBe("returned-completed")
})

test("offline changes wait in the outbox and send when back online", async () => {
  await mount()
  act(() => { store.login("anto@emi.id", "Staff@123") })
  act(() => store.setForceOffline(true))
  act(() => { store.scan(key("PPK"), "emi:line:98:2") })
  expect(store.outbox).toHaveLength(1)
  act(() => store.setForceOffline(false))
  await ReactTestRenderer.act(async () => {
    jest.advanceTimersByTime(1600)
  })
  expect(store.outbox).toHaveLength(0)
})
