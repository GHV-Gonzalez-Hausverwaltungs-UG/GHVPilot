// next.config.ts
const nextConfig = {
  reactStrictMode: true,
  output: "standalone", // falls du auf AWS / Docker / EB deployst

  // optional: Turbopack bleibt aktiv
  experimental: {
    turbo: true,
  },

  // Damit Bilder aus Supabase angezeigt werden dürfen:
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "vwvheqrtiuaaorojvznj.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
