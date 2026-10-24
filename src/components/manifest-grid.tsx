import { cn } from "@/lib/utils"
import type { PhaseProgress } from "@/lib/progress"

type CellState = "scanned" | "flagged" | "reported" | "pending"

/**
 * One cell per manifest line (a pallet, a crate, a set), in manifest order.
 * Scanned cells take the full hue, reported ones a hatch, pending ones stay
 * empty, so the gap left at a checkpoint is visible at a glance.
 */
export function ManifestGrid({
  progress,
  codes,
  tone = "light",
  legend = true,
  className,
}: {
  progress: PhaseProgress
  codes: string[]
  tone?: "light" | "dark"
  legend?: boolean
  className?: string
}) {
  const cells: CellState[] = codes.map((code) => {
    const st = progress.byAsset[code]
    if (st.state === "scanned") return progress.flagged.includes(code) ? "flagged" : "scanned"
    if (st.state === "reported") return "reported"
    return "pending"
  })
  const dark = tone === "dark"
  const count = (s: CellState) => cells.filter((c) => c === s).length

  return (
    <div className={className}>
      <div className="flex gap-[3px]" role="img" aria-label={`${count("scanned") + count("flagged")} scanned, ${count("reported")} reported, ${count("pending")} to scan`}>
        {cells.map((state, i) => (
          <Cell key={codes[i]} state={state} dark={dark} className="h-6 min-w-0 flex-1" />
        ))}
      </div>
      {legend && (
        <div className={cn("mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs tabular", dark ? "text-white/75" : "text-muted-foreground")}>
          <Key state="scanned" dark={dark} label={`${count("scanned") + count("flagged")} scanned`} />
          {count("reported") > 0 && <Key state="reported" dark={dark} label={`${count("reported")} reported`} />}
          {count("flagged") > 0 && <Key state="flagged" dark={dark} label={`${count("flagged")} skipped a checkpoint`} />}
          <Key state="pending" dark={dark} label="to scan" />
        </div>
      )}
    </div>
  )
}

function Key({ state, dark, label }: { state: CellState; dark: boolean; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <Cell state={state} dark={dark} className="size-3" />
      {label}
    </span>
  )
}

function Cell({ state, dark, className }: { state: CellState; dark: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "relative block overflow-hidden rounded-[2px]",
        state === "scanned" && (dark ? "bg-[#f07aa8]" : "bg-brand"),
        state === "flagged" && "bg-[#d97706]",
        state === "reported" && (dark ? "border border-[#f07aa8]" : "border border-brand"),
        state === "pending" && (dark ? "border border-white/30" : "border border-input bg-card"),
        className
      )}
    >
      {state === "reported" && (
        <svg className="absolute inset-0 size-full" aria-hidden>
          <defs>
            <pattern id={`hatch-${dark ? "d" : "l"}`} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="4" stroke={dark ? "#f07aa8" : "#b8336a"} strokeWidth="1.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#hatch-${dark ? "d" : "l"})`} />
        </svg>
      )}
    </span>
  )
}
