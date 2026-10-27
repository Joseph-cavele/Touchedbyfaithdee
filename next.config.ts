import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Serve images straight from source (Unsplash/Cloudinary CDNs) instead of
    // proxying every image through Next's optimizer. The optimizer is a
    // server-side round-trip per image, which stalls on this machine and leaves
    // images blank; the CDNs already deliver appropriately sized images
    // (Unsplash URLs carry w=/q= params). Remove this to re-enable optimization
    // once the dev environment is fast enough.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        // Uploaded hairstyle/service/stylist images (see lib/cloudinary.ts).
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
    // Cache optimized images for 24h so repeat views skip re-optimization.
    minimumCacheTTL: 60 * 60 * 24,
  },
  // NOTE: experimental.optimizePackageImports was removed. It forces the dev
  // compiler to analyze the very large `recharts`/`lucide-react` barrels, which
  // was pegging CPU and preventing routes from ever compiling (blank page).
};

export default nextConfig;
