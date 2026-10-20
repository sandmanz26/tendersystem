import {
  Armchair,
  Flower2,
  Lamp,
  Shirt,
  Speaker,
  Sparkles,
  Wine,
} from "lucide-react"

import type { AssetCategory } from "@/data/types"
import { cn } from "@/lib/utils"

const ICONS: Record<AssetCategory, React.ComponentType<{ className?: string }>> = {
  Furniture: Armchair,
  Dekorasi: Sparkles,
  Lighting: Lamp,
  Sound: Speaker,
  Linen: Shirt,
  Tableware: Wine,
  "Bunga & Props": Flower2,
}

export function CategoryIcon({
  category,
  className,
}: {
  category: AssetCategory
  className?: string
}) {
  const Icon = ICONS[category]
  return (
    <span
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted/60 text-muted-foreground",
        className
      )}
    >
      <Icon className="size-[18px]" />
    </span>
  )
}
