import * as React from "react"
import { HashRouter, Route, Routes, useLocation } from "react-router-dom"

import { AppShell } from "@/components/app-shell"
import { Toaster } from "@/components/ui/sonner"
import { EventDetailPage } from "@/pages/event-detail"
import { HomePage } from "@/pages/home"
import { InventoryPage } from "@/pages/inventory"
import { ItemDetailPage } from "@/pages/item-detail"
import { NotFound } from "@/pages/not-found"
import { ProfilePage } from "@/pages/profile"
import { ReportDetailPage } from "@/pages/report-detail"
import { ReportNewPage } from "@/pages/report-new"
import { ReportsPage } from "@/pages/reports"
import { ScannerPage, ScanPickerPage } from "@/pages/scan"
import { AppStoreProvider } from "@/store/app-store"

function ScrollToTop() {
  const { pathname } = useLocation()
  React.useEffect(() => window.scrollTo(0, 0), [pathname])
  return null
}

export default function App() {
  return (
    <AppStoreProvider>
      <HashRouter>
        <ScrollToTop />
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<HomePage />} />
            <Route path="event/:id" element={<EventDetailPage />} />
            <Route path="event/:eventId/barang/:code" element={<ItemDetailPage />} />
            <Route path="barang" element={<InventoryPage />} />
            <Route path="barang/:code" element={<ItemDetailPage />} />
            <Route path="scan" element={<ScanPickerPage />} />
            <Route path="scan/:eventId" element={<ScannerPage />} />
            <Route path="lapor" element={<ReportNewPage />} />
            <Route path="laporan" element={<ReportsPage />} />
            <Route path="laporan/:id" element={<ReportDetailPage />} />
            <Route path="profil" element={<ProfilePage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </HashRouter>
      <Toaster />
    </AppStoreProvider>
  )
}
