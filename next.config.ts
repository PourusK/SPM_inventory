import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Server Actions default to a 1 MB request body. ImportFlow sends the
    // selected document as multipart FormData, so ordinary vessel PDFs were
    // rejected by Next.js before runImport could inspect or extract them.
    // Keep this below Vercel's request limit while leaving room for multipart
    // boundaries and metadata.
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
