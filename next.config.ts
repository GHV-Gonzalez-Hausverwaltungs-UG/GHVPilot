import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  // eslint: {
  //   // 🚀 verhindert, dass Lint-Fehler den Build stoppen
  //   ignoreDuringBuilds: true,
  // },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "vwvheqrtiuaaorojvznj.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;

// // next.config.mjs
// import { createRequire } from "module";
// const require = createRequire(import.meta.url);
// const withPWA = require("next-pwa")({
//   dest: "public",
//   register: true,
//   skipWaiting: true,
// });

// const nextConfig = {
//   reactStrictMode: true,
//   experimental: {
//     typedRoutes: true,
//   },
// };

// export default withPWA(nextConfig);
