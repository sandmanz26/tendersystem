import { ASSETS, PEOPLE } from "./mock"
import type { Asset, Person } from "./types"

const assetMap = new Map(ASSETS.map((a) => [a.code, a]))
const personMap = new Map(PEOPLE.map((p) => [p.id, p]))

export function getAsset(code: string): Asset | undefined {
  return assetMap.get(code)
}

export function getPerson(id: string): Person | undefined {
  return personMap.get(id)
}

export function personName(id: string) {
  return getPerson(id)?.name ?? "—"
}
