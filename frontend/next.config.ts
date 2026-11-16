import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "localhost:3000",
    "localhost",
    "127.0.0.1:3000",
    "127.0.0.1",
    "192.168.1.190:3000",
    "192.168.1.190",
    "192.168.1.160",
    "*.local",
    "*.lan",
  ],
  async redirects() {
    return [
      {
        source: "/",
        destination: "/login",
        permanent: false,
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
