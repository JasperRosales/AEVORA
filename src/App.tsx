import { Suspense, useEffect, useState, type ReactNode } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Header } from "@/components/layout/header"
import { Sidebar, type Page } from "@/components/layout/sidebar"
import { PageFallback } from "@/components/ui/page-fallback"
import { refreshSession, useSession } from "@/data/session"
import { ensureDataLoaded } from "@/data/store"
import { LoginPage } from "@/features/auth/login-page"
import {
  ClientApp,
  PAGES,
  StaffAccountsPage,
  warmPage,
} from "@/features/lazy-routes"
import { pageSwap, screenFade } from "@/lib/motion"

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

  // One key per top-level screen so AnimatePresence can cross-fade between
  // the login wall, the client portal and the staff dashboard.
  const screen =
    status === "loading"
      ? "loading"
      : status === "signedout"
        ? "login"
        : isClient
          ? "client"
          : hash === STAFF_PAGE_HASH
            ? user?.role === "admin"
              ? "staff-accounts"
              : "not-found"
            : "dashboard"

  let content: ReactNode

  if (screen === "loading") {
    content = <PageFallback fullScreen />
  } else if (screen === "login") {
    // The login screen is the first thing a signed-out user sees, so it stays
    // in the initial bundle (see the lazy-route notes in features/lazy-routes.ts).
    content = <LoginPage />
  } else if (screen === "client") {
    // Client accounts see the mobile-first portal, not the staff dashboard.
    content = (
      <Suspense fallback={<PageFallback fullScreen />}>
        <ClientApp />
      </Suspense>
    )
  } else if (screen === "not-found") {
    // Hidden staff-accounts page: not in the sidebar; only for admins. Anyone
    // else gets a plain 404 so the route stays undiscoverable.
    content = (
      <div className="flex min-h-svh items-center justify-center bg-navy">
        <p className="text-sm text-cream/60">404 — Page not found</p>
      </div>
    )
  } else if (screen === "staff-accounts") {
    content = (
      <div className="min-h-svh bg-cream p-6">
        <Suspense fallback={<PageFallback fullScreen />}>
          <StaffAccountsPage
            onBack={() => {
              window.location.hash = ""
            }}
          />
        </Suspense>
      </div>
    )
  } else {
    const CurrentPage = PAGES[page]
    content = (
      <div className="flex min-h-svh">
        <Sidebar active={page} onNavigate={setPage} onPrefetch={warmPage} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header title={page} />
          <main className="flex-1 p-6">
            <Suspense fallback={<PageFallback />}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={page}
                  variants={pageSwap}
                  initial="hidden"
                  animate="show"
                  exit="exit"
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

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={screen}
        variants={screenFade}
        initial="hidden"
        animate="show"
        exit="exit"
      >
        {content}
      </motion.div>
    </AnimatePresence>
  )
}
