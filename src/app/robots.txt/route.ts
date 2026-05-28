const BASE = process.env.NEXT_PUBLIC_BASE_URL || process.env.PUPPETEER_BASE_URL || "https://example.com";

export async function GET() {
  const content = `User-agent: *\nAllow: /\nSitemap: ${BASE}/sitemap.xml\n`;
  return new Response(content, { headers: { "Content-Type": "text/plain" } });
}
