import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components: `fetch` is uncached by default; opt in with `use cache`
  // or stream under <Suspense>. See CLAUDE.md.
  cacheComponents: true,
  experimental: {
    // Lets the Next.js DevTools simulate instant navigations.
    instantNavigationDevToolsToggle: true,
  },
};

export default nextConfig;
