import type { MetadataRoute } from "next";

import { teams } from "@/lib/data";
import { getPublicSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getPublicSiteUrl();

  return [
    "",
    "/dashboard",
    "/model-lab",
    "/calibration",
    ...teams.map((team) => `/teams/${team.id}`),
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date("2026-06-10"),
    changeFrequency: path.startsWith("/teams") ? "monthly" : "weekly",
    priority: path === "" ? 1 : path === "/dashboard" ? 0.9 : 0.7,
  }));
}
