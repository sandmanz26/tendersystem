import { Armchair, Flower2, Lamp, Shirt, Sparkles, Speaker, Wine } from "lucide-react"

import type { AssetCategory } from "@/data/types"
import { cn } from "@/lib/utils"

const STYLE: Record<AssetCategory, { icon: React.ComponentType<{ className?: string }>; tone: string }> = {
  Furniture: { icon: Armchair, tone: "bg-[oklch(0.95_0.03_60)] text-[oklch(0.5_0.1_55)]" },
  Decor: { icon: Sparkles, tone: "bg-[oklch(0.95_0.03_330)] text-[oklch(0.5_0.12_340)]" },
  Lighting: { icon: Lamp, tone: "bg-[oklch(0.96_0.05_95)] text-[oklch(0.5_0.1_85)]" },
  Sound: { icon: Speaker, tone: "bg-[oklch(0.95_0.03_250)] text-[oklch(0.48_0.12_255)]" },
  Linen: { icon: Shirt, tone: "bg-[oklch(0.95_0.03_200)] text-[oklch(0.48_0.08_210)]" },
  Tableware: { icon: Wine, tone: "bg-[oklch(0.95_0.03_290)] text-[oklch(0.48_0.1_290)]" },
  "Flowers & Props": { icon: Flower2, tone: "bg-[oklch(0.95_0.04_150)] text-[oklch(0.48_0.1_155)]" },
}

export function CategoryIcon({ category, className }: { category: AssetCategory; className?: string }) {
  const { icon: Icon, tone } = STYLE[category]
  return (
    <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", tone, className)}>
      <Icon className="size-[18px]" />
    </span>
  )
}
