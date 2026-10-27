import { CloudOff, RefreshCw } from "lucide-react"

import { cn } from "@/lib/utils"
import { useAppStore } from "@/store/app-store"

/**
 * Thin strip under the header when the device is offline or still pushing
 * queued scans. Scanning keeps working offline; this only sets expectations.
 */
export function SyncStatus({ className, dark }: { className?: string; dark?: boolean }) {
  const { online, pendingSync } = useAppStore()
  if (online && pendingSync === 0) return null
  return (
    <div
      role="status"
      className={cn(
        "flex items-center gap-2 px-4 py-2 text-[13px] font-medium",
        online
          ? dark
            ? "bg-white/10 text-white"
            : "bg-brand-soft text-brand-ink"
          : dark
            ? "bg-[#3a2a10] text-[#fcd34d]"
            : "bg-pill-warning text-pill-warning-ink",
        className
      )}
    >
      {online ? (
        <RefreshCw className="size-3.5 animate-spin" />
      ) : (
        <CloudOff className="size-3.5" />
      )}
      {online
        ? `Syncing ${pendingSync}…`
        : pendingSync > 0
          ? `Offline · ${pendingSync} queued on this phone`
          : "Offline · still works, saves on this phone"}
    </div>
  )
}
