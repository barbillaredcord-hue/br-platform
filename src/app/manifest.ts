import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "B.R — Beat Room",
    short_name: "B.R",
    description: "Plataforma privada de beats, previews y accesos exclusivos.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#050607",
    theme_color: "#050607",
    icons: [
      {
        src: "/brand/br-platform-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/br-platform-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
