import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { MotionConfig } from "motion/react"

import "./index.css"
import App from "./App.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      {/* Honour the OS "reduce motion" setting for every Motion animation. */}
      <MotionConfig reducedMotion="user">
        <App />
      </MotionConfig>
    </ThemeProvider>
  </StrictMode>
)
