import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AI Resume Builder",
    short_name: "Resume Builder",
    description: "AI-powered resume tailoring, JD match analysis, and learning roadmaps.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#2563eb",
    orientation: "portrait",
    icons: [
      {
        src: "/pwa-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/pwa-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}

