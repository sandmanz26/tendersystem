import * as React from "react"
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function ToggleGroup({
  className,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root>) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      className={cn("flex flex-wrap gap-2", className)}
      {...props}
    />
  )
}

function ToggleGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      className={cn(
        "inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-card px-3.5 text-[13px] font-semibold shadow-soft transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 data-[state=on]:bg-ink data-[state=on]:text-white data-[state=on]:shadow-none [&_svg]:size-3.5",
        className
      )}
      {...props}
    />
  )
}

export { ToggleGroup, ToggleGroupItem }
