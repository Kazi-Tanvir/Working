import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use standalone mode for Docker builds; Vercel deploys natively as serverless lambdas
  output: process.env.DOCKER_BUILD ? "standalone" : undefined,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.myanimelist.net" },
      { protocol: "https", hostname: "s4.anilist.co" },
      { protocol: "https", hostname: "image.tmdb.org" },
      { protocol: "https", hostname: "m.media-amazon.com" },
      { protocol: "https", hostname: "media.rawg.io" },
      { protocol: "https", hostname: "shared.akamai.steamstatic.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "supercell.com" },
      { protocol: "https", hostname: "cdn.thegamesdb.net" },
      { protocol: "https", hostname: "images.gog-statics.com" },
    ],
  },
  allowedDevOrigins: [
    "*.ngrok-free.dev",
    "*.ngrok-free.app",
    "deranged-rekindle-venue.ngrok-free.dev",
    "*.vercel.app",
  ],
};

export default nextConfig;
