// sitemap.xml: the list of pages, with the date the data last changed,
// so search engines find every page and know when to come back.
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import meta from "@/public/data/meta.json";

const PAGES = [
  { path: "", priority: 1 },
  { path: "/scenario", priority: 0.8 },
  { path: "/method", priority: 0.8 },
  { path: "/ask", priority: 0.6 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const updated = new Date(meta.data_updated + "T00:00:00Z");
  return PAGES.map((p) => ({
    url: `${SITE_URL}${p.path}`,
    lastModified: updated,
    changeFrequency: "weekly",
    priority: p.priority,
  }));
}
