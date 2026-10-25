import { useId } from "react"
import { motion } from "motion/react"
import { EASE_OUT } from "@/lib/motion"

/**
 * Aevora's opening splash screen.
 *
 * A four-petal emblem draws itself inside a slowly turning dotted orbit over
 * the deep-navy brand background, with the wordmark glowing underneath.
 *
 * The whole lockup is sized in `vmin` with a rem cap, so it scales down on
 * short landscape phones and small portrait screens instead of clipping, and
 * stays restrained on large monitors. All animation is CSS-driven and honours
 * `prefers-reduced-motion`.
 */
export function AevoraSplash() {
  // Unique gradient/filter ids: the splash can overlap the screen it is
  // fading into, and duplicate ids would make one SVG reference the other's
  // gradient.
  const uid = useId().replace(/:/g, "")
  const gradientId = `aevora-gradient-${uid}`
  const glowId = `aevora-glow-${uid}`

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: EASE_OUT }}
      role="status"
      aria-live="polite"
      className="aevora-splash"
    >
      <span className="sr-only">Loading Aevora…</span>

      <div className="aevora-aura" aria-hidden="true" />

      <div className="aevora-lockup">
        <svg
          className="aevora-emblem"
          viewBox="0 0 300 300"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            {/* Ice-blue metallic gradient. */}
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="25%" stopColor="#E0F2FE" />
              <stop offset="65%" stopColor="#93C5FD" />
              <stop offset="100%" stopColor="#BAE6FD" />
            </linearGradient>

            <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Dotted orbit ring, slowly rotating. */}
          <circle
            cx="150"
            cy="150"
            r="132"
            stroke={`url(#${gradientId})`}
            strokeOpacity="0.2"
            strokeWidth="1"
            strokeDasharray="2 10"
            className="aevora-orbit"
          />

          {/* Boundary circle. pathLength=1 normalises the dash so the draw
              animation is exact at any rendered size. */}
          <circle
            cx="150"
            cy="150"
            r="112"
            pathLength={1}
            stroke={`url(#${gradientId})`}
            strokeWidth="2.2"
            className="aevora-draw-circle"
            filter={`url(#${glowId})`}
          />

          {/* Four-petal floral emblem with lifted side petals. */}
          <path
            d="M 150,150 C 122,108 126,52 150,40 C 174,52 178,108 150,150 Z"
            pathLength={1}
            stroke={`url(#${gradientId})`}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="aevora-draw-petal aevora-petal-top"
            filter={`url(#${glowId})`}
          />
          <path
            d="M 150,150 C 182,108 238,98 252,118 C 242,144 188,162 150,150 Z"
            pathLength={1}
            stroke={`url(#${gradientId})`}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="aevora-draw-petal aevora-petal-right"
            filter={`url(#${glowId})`}
          />
          <path
            d="M 150,150 C 122,192 126,248 150,260 C 174,248 178,192 150,150 Z"
            pathLength={1}
            stroke={`url(#${gradientId})`}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="aevora-draw-petal aevora-petal-bottom"
            filter={`url(#${glowId})`}
          />
          <path
            d="M 150,150 C 118,108 62,98 48,118 C 58,144 112,162 150,150 Z"
            pathLength={1}
            stroke={`url(#${gradientId})`}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="aevora-draw-petal aevora-petal-left"
            filter={`url(#${glowId})`}
          />

          <circle
            cx="150"
            cy="150"
            r="2.5"
            fill={`url(#${gradientId})`}
            opacity="0.8"
          />
        </svg>

        <span className="aevora-wordmark" aria-hidden="true">
          aevora
        </span>
      </div>
    </motion.div>
  )
}
