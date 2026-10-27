import * as React from "react"
import { CircleCheck, PenLine, TriangleAlert } from "lucide-react"
import { toast } from "sonner"

import { Callout } from "@/components/section"
import { SignaturePad } from "@/components/signature-pad"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PHASES } from "@/data/phases"
import type { WeddingEvent } from "@/data/types"
import type { PhaseProgress } from "@/lib/progress"
import { useAppStore } from "@/store/app-store"

/**
 * Bottom sheet that closes the current phase. Phases with a handover need the
 * receiving party's name and signature before the button unlocks.
 */
export function PhaseCompleteSheet({
  event,
  progress,
  open,
  onOpenChange,
  onDone,
}: {
  event: WeddingEvent
  progress: PhaseProgress
  open: boolean
  onOpenChange: (open: boolean) => void
  onDone?: () => void
}) {
  const { advancePhase } = useAppStore()
  const { phase } = progress
  const next = PHASES[event.phaseIndex + 1]
  const [name, setName] = React.useState("")
  const [signature, setSignature] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)

  const needsHandover = !!phase.handover
  const ready = progress.complete && (!needsHandover || (name.trim().length >= 3 && signature))

  const submit = () => {
    if (!ready || busy) return
    setBusy(true)
    const ok = advancePhase(
      event.id,
      needsHandover ? { name: name.trim(), party: phase.handover!.party, signature: signature! } : undefined
    )
    setBusy(false)
    if (!ok) {
      toast.error("This phase can't be closed yet. Data changed, recheck the item list.")
      onOpenChange(false)
      return
    }
    toast.success(next ? `Moved to ${next.label}` : "Event closed. Thank you!")
    onOpenChange(false)
    onDone?.()
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} repositionInputs={false}>
      <DrawerContent>
        <DrawerHeader className="pb-0">
          <DrawerTitle className="text-lg">Complete {phase.label}</DrawerTitle>
          <DrawerDescription>
            {next
              ? `Next: ${next.label} · can't be undone`
              : "All items back · closes the event"}
          </DrawerDescription>
        </DrawerHeader>

        <div className="space-y-3 overflow-y-auto px-4 pt-4">
          {phase.requiresScan ? (
            <div className="grid grid-cols-3 gap-2 text-center">
              <Stat value={progress.scanned} label="Scanned" />
              <Stat value={progress.reported} label="Reported" />
              <Stat value={progress.flagged.length} label="To check" warn={progress.flagged.length > 0} />
            </div>
          ) : (
            <Callout icon={CircleCheck} tone="success">
              {progress.tasksDone.length} checklist items done
            </Callout>
          )}

          {progress.flagged.length > 0 && (
            <Callout icon={TriangleAlert}>
              {progress.flagged.length} skipped the last checkpoint · flagged
            </Callout>
          )}

          {needsHandover && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <PenLine className="size-4" />
                Handover · {phase.handover!.party}
              </div>
              <div className="space-y-2">
                <Label htmlFor="handover-name">Receiver's name</Label>
                <Input
                  id="handover-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  autoComplete="off"
                />
              </div>
              <SignaturePad onChange={setSignature} />
            </div>
          )}
        </div>

        <DrawerFooter>
          <Button size="lg" variant="brand" disabled={!ready || busy} onClick={submit}>
            {next ? `Continue to ${next.label}` : "Close event"}
          </Button>
          {needsHandover && !ready && (
            <p className="text-center text-xs text-muted-foreground">
              Name + signature needed
            </p>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

function Stat({ value, label, warn }: { value: number; label: string; warn?: boolean }) {
  return (
    <div className={warn ? "rounded-md bg-pill-warning py-3 text-pill-warning-ink" : "rounded-md bg-secondary py-3"}>
      <div className="text-xl font-semibold tabular">{value}</div>
      <div className="text-[12px] text-muted-foreground">{label}</div>
    </div>
  )
}
