import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  // Declare your Neon services here
  auth: true,
  functions: {
    api: {
      name: "AEVORA API",
      source: "api/index.ts",
      // Shared secret checked on every data route; pulled from .env.local at
      // deploy time and exposed to the SPA as VITE_NEON_API_KEY.
      env: { API_KEY: process.env.API_KEY! },
    },
  },
  buckets: {
    // "private" is the default; use "public_read" for anonymous reads
    assets: { access: "private" },
  },
  // Branch policy: per-branch tuning
  branch: (branch) => {
    if (branch.isDefault) {
      // Default branch: no overrides, uses project defaults
      return {};
    }
    if (!branch.exists) {
      // New non-default branches: auto-expire
      // Run `neon checkout <name>` to create a new branch with these settings
      return { ttl: "7d" };
    }
    // Existing branch: no changes
    return {};
  },
});
