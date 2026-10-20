import { Suspense, useEffect, useState, type ReactNode } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Header } from "@/components/layout/header"
import { Sidebar, type Page } from "@/components/layout/sidebar"
import { PageFallback } from "@/components/ui/page-fallback"
import { refreshSession, signOut, useSession } from "@/data/session"
import { ensureDataLoaded } from "@/data/store"
import { AdminLoginPage } from "@/features/auth/admin-login-page"
import { ClientLoginPage } from "@/features/auth/client-login-page"
import {
  ClientApp,
  PAGES,
  StaffAccountsPage,
  warmPage,
} from "@/features/lazy-routes"
import { pageSwap, screenFade } from "@/lib/motion"

const STAFF_PAGE_HASH = "#/staff-accounts"

/**
 * Which portal this page load serves. The site is split by path so the two
 * audiences get distinct URLs and endpoints:
 *
 *   /login        admin/staff login        /        staff dashboard
 *   /client/login family login             /client  family client portal
 *
 * Signed-out visits to an app URL are pointed at that side's login endpoint
 * (see the effect below); signed-in visits to a login endpoint go the other
 * way. A role that doesn't match the portal is signed out with an error (see
 * the mismatch effect below).
 */
const pathname = window.location.pathname
const side: "admin" | "client" = pathname.startsWith("/client")
  ? "client"
  : "admin"
const isLoginEndpoint = pathname === "/login" || pathname === "/client/login"
const loginEndpoint = side === "client" ? "/client/login" : "/login"
const appEndpoint = side === "client" ? "/client" : "/"

export default function App() {
  const { status, user } = useSession()
  const [page, setPage] = useState<Page>("Overview")
  const [hash, setHash] = useState(() => window.location.hash)
  const [mismatch, setMismatch] = useState<string | null>(null)

  useEffect(() => {
    void refreshSession()
    const onHashChange = () => setHash(window.location.hash)
    window.addEventListener("hashchange", onHashChange)
    return () => window.removeEventListener("hashchange", onHashChange)
  }, [])

  // The staff dashboard (and its all-records API calls) only loads for
  // staff/admin on the admin side; clients get the mobile portal at
  // /client, which fetches its own server-scoped data instead.
  const isClient = user?.role === "client"
  useEffect(() => {
    if (status === "signedin" && !isClient && side === "admin") {
      ensureDataLoaded()
    }
  }, [status, isClient])

  // The two portals are separate URLs: a client account on the admin side (or
  // a staff/admin account on /client) is signed out and told where to go. The
  // message is stashed once sign-out finishes so the login screen can show it.
  const wrongSide =
    status === "signedin" && (side === "client" ? !isClient : isClient)
  useEffect(() => {
    if (!wrongSide) return
    const message =
      side === "client"
        ? "This account cannot sign in on the client portal. Staff and admin accounts sign in on the main site."
        : "This account cannot sign in on the main site. Clients sign in on the client portal."
    void signOut().then(() => setMismatch(message))
  }, [wrongSide])

  // Keep the address bar on the endpoint that matches the session: a
  // signed-out visit to an app URL lands on that side's login endpoint, and a
  // signed-in visit to a login endpoint lands on the app. replaceState only —
  // the screen is already selected for the session state below, so no reload.
  useEffect(() => {
    if (status === "loading" || wrongSide) return
    if (status === "signedout" && !isLoginEndpoint) {
      window.history.replaceState(null, "", loginEndpoint)
    } else if (status === "signedin" && isLoginEndpoint) {
      window.history.replaceState(null, "", appEndpoint)
    }
  }, [status, wrongSide])

  // A fresh screen starts at the top — quick actions and the sidebar both
  // jump between pages from anywhere in a scrolled view.
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [page])

  // One key per top-level screen so AnimatePresence can cross-fade between
  // the login wall, the client portal and the staff dashboard. While a
  // role/portal mismatch is being signed out, keep the loading screen up so
  // the wrong portal never renders.
  const screen =
    status === "loading" || wrongSide
      ? "loading"
      : status === "signedout"
        ? `login-${side}`
        : side === "client"
          ? "client"
          : hash === STAFF_PAGE_HASH
            ? user?.role === "admin"
              ? "staff-accounts"
              : "not-found"
            : "dashboard"

  let content: ReactNode

  if (screen === "loading") {
    content = <PageFallback fullScreen />
  } else if (screen === "login-admin" || screen === "login-client") {
    // Each portal has its own login screen at its own URL endpoint (/login
    // and /client/login; see App.tsx's path split above). Both stay in the
    // initial bundle — the login wall is the first thing a signed-out user
    // sees (see the lazy-route notes in features/lazy-routes.ts).
    // `mismatch` explains a wrong-portal sign-out after the auto sign-out
    // effect above ran.
    content =
      screen === "login-client" ? (
        <ClientLoginPage notice={mismatch} />
      ) : (
        <AdminLoginPage notice={mismatch} />
      )
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
                  <CurrentPage onNavigate={setPage} onPrefetch={warmPage} />
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
