const BASE = process.env.NEXT_PUBLIC_BASE_URL || process.env.PUPPETEER_BASE_URL || "https://example.com";
const LAST_MOD = new Date().toISOString().split("T")[0];

/** Only publicly indexable, non-auth-gated routes. */
const ROUTES: { path: string; priority: string; changefreq: string }[] = [
  { path: "/",        priority: "1.0", changefreq: "weekly" },
  { path: "/privacy", priority: "0.3", changefreq: "monthly" },
  { path: "/terms",   priority: "0.3", changefreq: "monthly" },
];

export async function GET() {
  const urls = ROUTES.map(
    ({ path, priority, changefreq }) =>
      `  <url>\n    <loc>${BASE}${path}</loc>\n    <lastmod>${LAST_MOD}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`
  ).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;

  return new Response(xml, { headers: { "Content-Type": "application/xml" } });
}
