import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components: `fetch` is uncached by default; opt in with `use cache`
  // or stream under <Suspense>. See CLAUDE.md.
  cacheComponents: true,
  experimental: {
    // Lets the Next.js DevTools simulate instant navigations.
    instantNavigationDevToolsToggle: true,
    // Profile-photo uploads go through a Server Action; default cap is 1 MB.
    // Avatars are validated to ≤2 MB — allow headroom for multipart overhead.
    serverActions: { bodySizeLimit: "3mb" },
  },
};

export default nextConfig;
