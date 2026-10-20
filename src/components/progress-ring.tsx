import { cn } from "@/lib/utils"

export function ProgressRing({
  value,
  size = 56,
  stroke = 5,
  className,
  trackClassName = "stroke-secondary",
  barClassName = "stroke-brand",
  children,
}: {
  value: number
  size?: number
  stroke?: number
  className?: string
  trackClassName?: string
  barClassName?: string
  children?: React.ReactNode
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className={trackClassName} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (pct / 100) * c}
          className={cn("transition-[stroke-dashoffset] duration-500 ease-out", barClassName)}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">{children}</div>
      )}
    </div>
  )
}
