import { ArrowRight, ScanLine, TriangleAlert, Undo2 } from "lucide-react-native"
import * as React from "react"
import { ScrollView, View } from "react-native"

import { fmtNum } from "../core/format"
import { OWNERSHIPS, planAdvance, type AdvanceStep } from "../core/rules"
import type { Ownership } from "../core/types"
import type { EventView } from "../selectors"
import { useAppStore } from "../store"
import { color, mono, radius, tabular } from "../theme"
import { Button, Callout, Segmented, Text } from "./primitives"
import { Sheet } from "./sheet"
import { useToast } from "./toast"

/**
 * Next stage, through the web's dialogs in the web's order:
 * ownership check (if the stage asks) → broken-item warning → confirmation.
 */
export function AdvanceSheet({ view, visible, onClose }: { view: EventView; visible: boolean; onClose: () => void }) {
  const store = useAppStore()
  const toast = useToast()
  const asked = (store.ownershipAsked[view.key] ?? []).includes(view.stage.status)
  const plan = planAdvance(store.stages, view.stage.status, view.lines, asked)
  const [step, setStep] = React.useState<AdvanceStep | "assign">("confirm")
  const [changes, setChanges] = React.useState<Record<number, Ownership>>({})

  React.useEffect(() => {
    if (visible) {
      setStep(plan.steps[0] ?? "confirm")
      setChanges({})
    }
    // Only when the sheet opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  if (!plan.target) return null
  const target = plan.target
  const after = (s: AdvanceStep) => plan.steps[plan.steps.indexOf(s) + 1] ?? "confirm"
  const route = (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: radius.control, backgroundColor: color.raised }}>
      <Text variant="small" numberOfLines={1} style={{ flexShrink: 1, fontWeight: "600" }}>
        {view.stage.status}
      </Text>
      <ArrowRight size={14} color={color.muted} />
      <Text variant="small" numberOfLines={1} style={{ flexShrink: 1, fontWeight: "600", color: color.brandInk }}>
        {target.status}
      </Text>
    </View>
  )

  const confirm = () => {
    const ok = store.advance(view.key)
    onClose()
    toast.show(ok ? `Moved to ${target.status}` : "Can't move yet. Something changed, check the list.", ok ? "success" : "error")
  }

  const titles: Record<typeof step, string> = {
    ownership: "Check ownership",
    assign: "Assign ownership",
    broken: "Broken items reported",
    confirm: "Move to next stage?",
  }

  return (
    <Sheet visible={visible} onClose={onClose} title={titles[step]} tall={step === "assign"}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 14 }}>
        {route}

        {step === "ownership" && (
          <>
            <Text>{`Before moving on from "${view.stage.status}": does any item need a change of ownership (IHC / IHP / Outsource)?`}</Text>
            <Text variant="meta">Choose Yes to assign ownership. Once you save it, the move continues.</Text>
            <View style={{ gap: 8 }}>
              <Button title="Yes, change ownership" variant="outline" onPress={() => setStep("assign")} />
              <Button
                title="No, continue"
                onPress={() => {
                  store.markOwnershipAsked(view.key)
                  setStep(after("ownership"))
                }}
              />
              <Button title="Cancel" variant="ghost" onPress={onClose} />
            </View>
          </>
        )}

        {step === "assign" && (
          <>
            {view.lines.map((l) => (
              <View key={l.id} style={{ gap: 6, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: color.rule }}>
                <Text variant="strong" numberOfLines={1} style={{ fontSize: 14 }}>{`${l.name} · ${fmtNum(l.qty)}`}</Text>
                <Segmented
                  value={changes[l.id] ?? l.ownership}
                  options={OWNERSHIPS.map((o) => ({ value: o, label: o }))}
                  onChange={(o) => setChanges((c) => ({ ...c, [l.id]: o }))}
                />
              </View>
            ))}
            <Button
              variant="positive"
              title="Save and continue"
              onPress={() => {
                const real = Object.fromEntries(Object.entries(changes).filter(([id, o]) => view.lines.find((l) => l.id === Number(id))?.ownership !== o))
                if (Object.keys(real).length) store.setOwnership(view.key, real as Record<number, Ownership>)
                store.markOwnershipAsked(view.key)
                setStep(after("ownership"))
              }}
            />
          </>
        )}

        {step === "broken" && (
          <>
            <Text>{`${plan.broken.length} item${plan.broken.length === 1 ? " still has" : "s still have"} broken units. If you continue, the broken units are taken out of the quantity used in this event.`}</Text>
            <View style={{ borderWidth: 1, borderColor: color.border, borderRadius: radius.control }}>
              <View style={{ flexDirection: "row", paddingHorizontal: 10, paddingVertical: 8, backgroundColor: color.raised }}>
                {["Item", "Prepared", "Broken", "Used"].map((h, i) => (
                  <Text key={h} variant="label" style={[{ fontSize: 11 }, i === 0 ? { flex: 1 } : { width: 62, textAlign: "right" }]}>
                    {h.toUpperCase()}
                  </Text>
                ))}
              </View>
              {plan.broken.map((l) => (
                <View key={l.id} style={{ flexDirection: "row", paddingHorizontal: 10, paddingVertical: 9, borderTopWidth: 1, borderTopColor: color.rule }}>
                  <Text variant="small" numberOfLines={1} style={{ flex: 1 }}>
                    {l.name}
                  </Text>
                  <Text variant="small" style={[{ width: 62, textAlign: "right" }, tabular]}>{fmtNum(l.qty)}</Text>
                  <Text variant="small" style={[{ width: 62, textAlign: "right", color: color.red, fontWeight: "600" }, tabular]}>{fmtNum(l.brokenQty ?? 0)}</Text>
                  <Text variant="small" style={[{ width: 62, textAlign: "right", fontWeight: "600" }, tabular]}>{fmtNum(l.qty - (l.brokenQty ?? 0))}</Text>
                </View>
              ))}
            </View>
            <Text variant="tiny">To replace them instead, cancel and request a production on the web first.</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Button variant="secondary" title="Cancel" style={{ flex: 1 }} onPress={onClose} />
              <Button title="Continue anyway" style={{ flex: 1 }} onPress={() => setStep("confirm")} />
            </View>
          </>
        )}

        {step === "confirm" && (
          <>
            {plan.scanTarget && <Callout icon={ScanLine} tone="brand">Items must be scanned at this stage before the event can move on.</Callout>}
            {target.stockReturn && (
              <Callout icon={Undo2} tone="green">
                {plan.returning
                  ? `Stock Return is on for "${target.status}". Confirming returns ${plan.returning} items to warehouse stock. After this, no more items can be added to this event.`
                  : "No items have had their stock cut, so nothing will be returned."}
              </Callout>
            )}
            {plan.broken.length > 0 && <Callout icon={TriangleAlert} tone="red">{`${plan.broken.reduce((n, l) => n + (l.brokenQty ?? 0), 0)} broken units will be written off.`}</Callout>}
            <Text variant="meta">
              Next is one step at a time. <Text variant="meta" style={{ fontFamily: mono }}>{target.code}</Text>
              {` is stage ${target.order} of the pipeline.`}
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Button variant="secondary" title="Cancel" style={{ flex: 1 }} onPress={onClose} />
              <Button title={target.stockReturn ? "Confirm & Return Stock" : "Confirm"} style={{ flex: 1 }} onPress={confirm} />
            </View>
          </>
        )}
      </ScrollView>
    </Sheet>
  )
}
