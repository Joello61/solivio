import type { NextConfig } from "next";

const apiUrl = new URL(
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"
);

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    unoptimized: isDev,
    remotePatterns: [
      {
        protocol: apiUrl.protocol.replace(":", "") as "http" | "https",
        hostname: apiUrl.hostname,
        // port est une chaine vide si c'est le port par defaut du protocole
        port: apiUrl.port,
        pathname: "/api/public/**",
      },
    ],
  },
};

export default nextConfig;
