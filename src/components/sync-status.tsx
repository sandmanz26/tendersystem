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
        "flex items-center gap-2 px-4 py-2 text-[12px] font-medium",
        online
          ? dark
            ? "bg-white/10 text-white/80"
            : "bg-accent text-accent-foreground"
          : dark
            ? "bg-warning/20 text-[oklch(0.88_0.1_75)]"
            : "bg-warning/15 text-[oklch(0.45_0.1_60)]",
        className
      )}
    >
      {online ? (
        <RefreshCw className="size-3.5 animate-spin" />
      ) : (
        <CloudOff className="size-3.5" />
      )}
      {online
        ? `Menyinkronkan ${pendingSync} data…`
        : pendingSync > 0
          ? `Offline · ${pendingSync} data tersimpan di HP, dikirim saat online`
          : "Offline · scan & laporan tetap bisa, disimpan di HP"}
    </div>
  )
}
