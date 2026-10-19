import { Suspense, useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Header } from "@/components/layout/header"
import { Sidebar, type Page } from "@/components/layout/sidebar"
import { PageFallback } from "@/components/ui/page-fallback"
import { refreshSession, useSession } from "@/data/session"
import { ensureDataLoaded } from "@/data/store"
import { LoginPage } from "@/features/auth/login-page"
import { ClientApp, PAGES, StaffAccountsPage, warmPage } from "@/features/lazy-routes"

const STAFF_PAGE_HASH = "#/staff-accounts"

export default function App() {
  const { status, user } = useSession()
  const [page, setPage] = useState<Page>("Overview")
  const [hash, setHash] = useState(() => window.location.hash)

  useEffect(() => {
    void refreshSession()
    const onHashChange = () => setHash(window.location.hash)
    window.addEventListener("hashchange", onHashChange)
    return () => window.removeEventListener("hashchange", onHashChange)
  }, [])

  // The staff dashboard (and its all-records API calls) only loads for
  // staff/admin; clients get the mobile portal, which fetches its own
  // server-scoped data instead.
  const isClient = user?.role === "client"
  useEffect(() => {
    if (status === "signedin" && !isClient) ensureDataLoaded()
  }, [status, isClient])

  if (status === "loading") return <PageFallback fullScreen />

  // The login screen is the first thing a signed-out user sees, so it stays in
  // the initial bundle (see the lazy-route notes in features/lazy-routes.ts).
  if (status === "signedout") return <LoginPage />

  // Client accounts see the mobile-first portal, not the staff dashboard.
  if (isClient) {
    return (
      <Suspense fallback={<PageFallback fullScreen />}>
        <ClientApp />
      </Suspense>
    )
  }

  // Hidden staff-accounts page: not in the sidebar; only for admins. Anyone
  // else gets a plain 404 so the route stays undiscoverable.
  if (hash === STAFF_PAGE_HASH) {
    if (user?.role !== "admin") {
      return (
        <div className="flex min-h-svh items-center justify-center bg-navy">
          <p className="text-sm text-cream/60">404 — Page not found</p>
        </div>
      )
    }
    return (
      <div className="min-h-svh bg-cream p-6">
        <Suspense fallback={<PageFallback fullScreen />}>
          <StaffAccountsPage onBack={() => { window.location.hash = "" }} />
        </Suspense>
      </div>
    )
  }

  const CurrentPage = PAGES[page]

  return (
    <div className="flex min-h-svh">
      <Sidebar active={page} onNavigate={setPage} onPrefetch={warmPage} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header title={page} />
        <main className="flex-1 p-6">
          <Suspense fallback={<PageFallback />}>
            <AnimatePresence mode="wait">
              <motion.div
                key={page}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <CurrentPage />
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </main>
      </div>
    </div>
  )
}
