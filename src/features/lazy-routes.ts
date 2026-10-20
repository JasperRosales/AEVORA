import { lazy, type ComponentType, type LazyExoticComponent } from "react"
import type { Page } from "@/components/layout/sidebar"

/**
 * Route-level code splitting.
 *
 * Every screen lives in its own chunk and is fetched the first time it is
 * shown, so the initial download only carries the app shell (session/auth
 * client, sidebar, header) and the login screen. Each chunk is declared once
 * below, keyed by the sidebar's own `Page` union — adding a sidebar entry
 * without a chunk is a type error.
 */

/**
 * Props the app shell may hand to a dashboard screen. They are optional so a
 * screen can ignore them: only ones with in-page shortcuts (the Overview
 * quick actions) use them.
 */
export interface DashboardProps {
  /** Sidebar-style navigation, so shortcuts inside a screen can switch page. */
  onNavigate?: (page: Page) => void
  /** Warms a screen's chunk before it is clicked (hover/keyboard focus). */
  onPrefetch?: (page: Page) => void
}

/** A screen's dynamic import, resolving to its default export. */
type Loader = () => Promise<{ default: ComponentType<DashboardProps> }>

const loaders: Record<Page, Loader> = {
  Overview: async () => ({
    default: (await import("@/features/overview/overview-page")).OverviewPage,
  }),
  "Cemetery Map": async () => ({
    default: (await import("@/features/map/cemetery-map-page")).CemeteryMapPage,
  }),
  Plots: async () => ({
    default: (await import("@/features/plots/plots-page")).PlotsPage,
  }),
  Reservations: async () => ({
    default: (await import("@/features/reservations/reservations-page"))
      .ReservationsPage,
  }),
  Clients: async () => ({
    default: (await import("@/features/clients/clients-page")).ClientsPage,
  }),
  Payments: async () => ({
    default: (await import("@/features/payments/payments-page")).PaymentsPage,
  }),
  Agreements: async () => ({
    default: (await import("@/features/agreements/agreements-page"))
      .AgreementsPage,
  }),
  Reports: async () => ({
    default: (await import("@/features/reports/reports-page")).ReportsPage,
  }),
}

/** Dashboard screens, switched by the sidebar and rendered in the page area. */
export const PAGES: Record<
  Page,
  LazyExoticComponent<ComponentType<DashboardProps>>
> = Object.fromEntries(
  Object.entries(loaders).map(([page, load]) => [page, lazy(load)])
) as Record<Page, LazyExoticComponent<ComponentType<DashboardProps>>>

/**
 * Fire-and-forget chunk warm-up, e.g. when the user hovers a sidebar entry.
 * Failures are swallowed: if a chunk cannot be fetched now, the navigation
 * that actually renders the screen will fetch it and surface any real error.
 */
export function warmPage(page: Page) {
  void loaders[page]().catch(() => {})
}

/** Role-specific screens reached outside the sidebar. */
export const ClientApp = lazy(async () => ({
  default: (await import("@/features/client/client-app")).ClientApp,
}))

export const StaffAccountsPage = lazy(async () => ({
  default: (await import("@/features/staff/staff-accounts-page"))
    .StaffAccountsPage,
}))
