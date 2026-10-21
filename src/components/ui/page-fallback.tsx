import { motion } from "motion/react"
import { EASE_OUT } from "@/lib/motion"

/**
 * Animated logo loading screen featuring the Aevora icon and wordmark,
 * styled with the deep navy & teal theme.
 */
export function PageFallback({ fullScreen = false }: { fullScreen?: boolean }) {
  const letters = "Aevora".split("")

  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* Icon + animated wordmark lockup */}
      <div className="flex items-center gap-3.5">
        <motion.img
          src="/aevora-icon.ico"
          alt="Aevora logo"
          initial={{ opacity: 0, scale: 0.7, rotate: -15 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 20,
            duration: 0.6,
          }}
          className="size-10 rounded-xl shadow-lg shadow-black/30"
        />
        
        <div className="flex overflow-hidden font-bold tracking-wider text-cream text-xl">
          {letters.map((char, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.15 + i * 0.07,
                duration: 0.45,
                ease: EASE_OUT,
              }}
              className="inline-block"
            >
              {char}
            </motion.span>
          ))}
        </div>
      </div>

      {/* Subtle pulsing loading dots */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.3 }}
        className="flex items-center gap-1.5"
        aria-hidden="true"
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="size-1.5 rounded-full bg-teal"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.2,
            }}
          />
        ))}
      </motion.div>
    </div>
  )

  if (fullScreen) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="flex min-h-svh items-center justify-center bg-navy"
      >
        {content}
      </motion.div>
    )
  }

  return <div className="py-24 flex justify-center">{content}</div>
}
