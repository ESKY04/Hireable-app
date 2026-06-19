/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.clerk.com" },
      { protocol: "https", hostname: "img.clerk.com" },
    ],
  },
  // Exclude Python lib files from Next.js processing
  webpack: (config) => {
    config.externals = [...(config.externals || []), "prisma", "@prisma/client"]
    return config
  },
}

module.exports = nextConfig
