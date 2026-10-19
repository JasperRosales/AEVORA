/**
 * Shared motion tokens.
 *
 * The vocabulary is intentionally restrained — short durations, soft easing
 * and 6–14px of travel — so the app reads as crafted rather than animated for
 * its own sake. `MotionConfig reducedMotion="user"` in `src/main.tsx` makes
 * Motion skip transform/layout animations when the OS requests reduced motion,
 * while opacity cues still play.
 */
import type { Transition, Variants } from "motion/react"

/** Decelerating curve for entrances. */
export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1]

/** Symmetric curve for state swaps and exits. */
export const EASE_SOFT: [number, number, number, number] = [0.4, 0, 0.2, 1]

/** Soft spring for shared-layout indicators (sidebar, tab bars). */
export const layoutSpring: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 34,
  mass: 0.8,
}

/** Whole-screen cross-fade used between login, portal and dashboard. */
export const screenFade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.32, ease: EASE_OUT } },
  exit: { opacity: 0, transition: { duration: 0.18, ease: EASE_SOFT } },
}

/** Page swap inside the dashboard (sidebar navigation). */
export const pageSwap: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE_OUT } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.16, ease: EASE_SOFT } },
}

/** Standard section/card entrance. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: EASE_OUT } },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.32, ease: EASE_OUT } },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.32, ease: EASE_OUT },
  },
}

/** Small horizontal travel for sidebars and tab content. */
export const slideIn: Variants = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { duration: 0.34, ease: EASE_OUT } },
}

/** Parent variant that reveals motion children one after another. */
export function stagger(staggerChildren = 0.06, delayChildren = 0): Variants {
  return {
    hidden: {},
    show: { transition: { staggerChildren, delayChildren } },
  }
}

/** Default child of a `stagger()` parent. */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: EASE_OUT } },
}

/** Table/list row: shorter travel keeps dense lists calm. */
export const rowList: Variants = stagger(0.025, 0.02)

export const rowItem: Variants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.26, ease: EASE_OUT } },
}
