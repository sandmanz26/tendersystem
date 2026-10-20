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
        title="Halaman tidak ditemukan"
        body="Data mungkin sudah dihapus atau tautannya salah."
        action={
          <Button asChild variant="outline">
            <Link to="/">Ke daftar event</Link>
          </Button>
        }
      />
    </div>
  )
}
