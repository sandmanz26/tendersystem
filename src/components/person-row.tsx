import { MessageCircle, Phone } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import type { Person } from "@/data/types"
import { initials, waLink } from "@/lib/format"

const TONES = [
  "bg-[oklch(0.92_0.03_150)] text-[oklch(0.35_0.05_155)]",
  "bg-[oklch(0.92_0.035_60)] text-[oklch(0.42_0.07_50)]",
  "bg-[oklch(0.92_0.02_240)] text-[oklch(0.38_0.05_250)]",
  "bg-[oklch(0.93_0.03_95)] text-[oklch(0.42_0.06_90)]",
  "bg-[oklch(0.92_0.03_10)] text-[oklch(0.42_0.08_15)]",
]

export function PersonAvatar({ person, className }: { person: Person; className?: string }) {
  const tone = TONES[Number(person.id.replace(/\D/g, "")) % TONES.length]
  return (
    <Avatar className={className ?? "size-10"}>
      <AvatarFallback className={tone}>{initials(person.name)}</AvatarFallback>
    </Avatar>
  )
}

export function PersonRow({
  person,
  detail,
  badge,
  isYou,
}: {
  person: Person
  detail?: string
  badge?: React.ReactNode
  isYou?: boolean
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <PersonAvatar person={person} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium">{person.name}</span>
          {isYou && <span className="text-xs text-muted-foreground">(kamu)</span>}
          {badge}
        </div>
        <div className="truncate text-[13px] text-muted-foreground">
          {detail ?? person.role}
          {person.company && ` · ${person.company}`}
        </div>
      </div>
      {!isYou && (
        <div className="flex gap-1">
          <Button asChild variant="secondary" size="icon-sm" aria-label={`WhatsApp ${person.name}`}>
            <a href={waLink(person.phone)} target="_blank" rel="noreferrer">
              <MessageCircle className="text-brand" />
            </a>
          </Button>
          <Button asChild variant="secondary" size="icon-sm" aria-label={`Telepon ${person.name}`}>
            <a href={`tel:${person.phone}`}>
              <Phone />
            </a>
          </Button>
        </div>
      )}
    </div>
  )
}

