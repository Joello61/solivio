import type { NextConfig } from "next";

// Vide dans les images deployees : le navigateur appelle l'API sur le meme
// domaine (/api route vers le backend par Traefik), une seule image sert
// donc la preproduction et la production.
const publicApiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
const apiUrl = publicApiUrl ? new URL(publicApiUrl) : null;

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.162'],
  output: "standalone",
  // Anciennes pages reunies dans Mes engagements : les liens et favoris restent valides.
  async redirects() {
    return [
      { source: "/mes-evenements", destination: "/mes-inscriptions", permanent: true },
      { source: "/mes-missions-collecte", destination: "/mes-inscriptions", permanent: true },
    ];
  },
  images: {
    unoptimized: isDev,
    remotePatterns: apiUrl
      ? [
          {
            protocol: apiUrl.protocol.replace(":", "") as "http" | "https",
            hostname: apiUrl.hostname,
            // port est une chaine vide si c'est le port par defaut du protocole
            port: apiUrl.port,
            pathname: "/api/public/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
