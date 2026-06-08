import type { NextConfig } from "next";

const apiUrl = new URL(
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"
);

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
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
