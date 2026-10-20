import { PHASES } from "@/data/phases"
import { cn } from "@/lib/utils"

/** Compact six-step tracker. Scan phases get a small square marker. */
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
          <li key={p.key} className="flex flex-col gap-1.5">
            <div
              className={cn(
                "h-1 rounded-full",
                dark ? "bg-white/15" : "bg-border",
                done && (dark ? "bg-white/85" : "bg-primary"),
                current && (dark ? "bg-[oklch(0.85_0.12_150)]" : "bg-primary/45")
              )}
            />
            {showLabels && (
              <span
                className={cn(
                  "truncate text-[10.5px] text-muted-foreground",
                  current && "font-semibold text-foreground",
                  done && "text-foreground/70"
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
