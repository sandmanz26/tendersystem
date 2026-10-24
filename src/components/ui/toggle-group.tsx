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
        "inline-flex h-9 flex-none items-center justify-center gap-1.5 rounded-md border border-input bg-card px-3 text-[13px] font-medium whitespace-nowrap transition-[color,background-color,border-color] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/30 data-[state=on]:border-brand data-[state=on]:bg-brand-soft data-[state=on]:text-brand-ink [&_svg]:size-3.5",
        className
      )}
      {...props}
    />
  )
}

export { ToggleGroup, ToggleGroupItem }
