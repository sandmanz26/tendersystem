import { Armchair, Flower2, Lamp, Shirt, Sparkles, Speaker, Wine } from "lucide-react"

import type { AssetCategory } from "@/data/types"
import { cn } from "@/lib/utils"

const ICONS: Record<AssetCategory, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  Furniture: Armchair,
  Decor: Sparkles,
  Lighting: Lamp,
  Sound: Speaker,
  Linen: Shirt,
  Tableware: Wine,
  "Flowers & Props": Flower2,
}

/** One grey outline icon per category in a fixed slot, so row text starts on one edge. */
export function CategoryIcon({ category, className }: { category: AssetCategory; className?: string }) {
  const Icon = ICONS[category]
  return (
    <span className={cn("flex size-5 shrink-0 items-center justify-center text-muted-foreground", className)}>
      <Icon className="size-[18px]" strokeWidth={1.6} />
    </span>
  )
}
