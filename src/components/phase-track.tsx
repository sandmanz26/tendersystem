import { PHASES } from "@/data/phases"
import { cn } from "@/lib/utils"

/** Six-segment tracker; the current segment is half filled. */
export function PhaseTrack({
  index,
  className,
  showLabels = true,
  tone = "light",
}: {
  index: number
  className?: string
  showLabels?: boolean
  tone?: "light" | "dark"
}) {
  const dark = tone === "dark"
  return (
    <ol className={cn("grid grid-cols-6 gap-1", className)}>
      {PHASES.map((p, i) => {
        const done = i < index
        const current = i === index
        return (
          <li key={p.key} className="flex min-w-0 flex-col gap-1.5">
            <div className={cn("relative h-1.5 overflow-hidden rounded-full", dark ? "bg-white/15" : "bg-secondary")}>
              <div
                className={cn(
                  "absolute inset-y-0 left-0 rounded-full",
                  dark ? "bg-[oklch(0.82_0.14_158)]" : "bg-brand",
                  done ? "w-full" : current ? "w-1/2" : "w-0"
                )}
              />
            </div>
            {showLabels && (
              <span
                className={cn(
                  "truncate text-[10.5px] font-medium",
                  dark ? "text-white/50" : "text-muted-foreground",
                  current && (dark ? "font-semibold text-white" : "font-semibold text-foreground")
                )}
              >
                {p.short}
              </span>
            )}
          </li>
        )
      })}
    </ol>
  )
}
