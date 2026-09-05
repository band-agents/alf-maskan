import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // This app has three root layouts — (marketing), (dashboard), (storefront)
    // — so an unmatched URL belongs to none of them and there is no single
    // layout a 404 could be composed from. `global-not-found.tsx` is the
    // documented answer for exactly that case, and it is why that file renders
    // its own <html> and <body>.
    globalNotFound: true,
  },
};

export default nextConfig;
