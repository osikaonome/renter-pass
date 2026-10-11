import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RenterPass",
    short_name: "RenterPass",
    description: "One link for every rental application, with your documents under your control.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#f6f7f5",
    theme_color: "#1f6f5c",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
