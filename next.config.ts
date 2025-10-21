import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimizaciones para producción
  output: "standalone", // Para Docker
  images: {
    domains: ["localhost", "vercel.app"], // Dominios permitidos
  },
  // Optimizaciones para hosting gratuito
  compress: true,
  poweredByHeader: false,
  // Configuración de seguridad
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
