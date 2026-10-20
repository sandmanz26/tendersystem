import { Link } from "react-router-dom"
import { SearchX } from "lucide-react"

import { EmptyState } from "@/components/section"
import { TopBar } from "@/components/top-bar"
import { Button } from "@/components/ui/button"

export function NotFound() {
  return (
    <div>
      <TopBar back="/" />
      <EmptyState
        icon={SearchX}
        title="Page not found"
        body="It may have been removed, or the link is wrong."
        action={
          <Button asChild variant="outline">
            <Link to="/">Go to events</Link>
          </Button>
        }
      />
    </div>
  )
}
