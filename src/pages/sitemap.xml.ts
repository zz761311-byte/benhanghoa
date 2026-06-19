import type { APIRoute } from "astro";
import { ALL } from "../data/commodities.mjs";
import { getCollection } from "astro:content";

const SITE = "https://benhanghoa.com";

// Sinh sitemap.xml động từ toàn bộ trang (tĩnh + hàng hóa + kiến thức + phân tích)
export const GET: APIRoute = async () => {
  const posts = await getCollection("posts");
  const knowledge = await getCollection("knowledge");

  type Entry = { path: string; lastmod?: string };
  const fmt = (d?: Date) => (d ? d.toISOString().slice(0, 10) : undefined);

  const entries: Entry[] = [
    { path: "" },              // trang chủ
    { path: "bang-gia" },
    { path: "tin-tuc" },
    { path: "phan-tich" },
    { path: "kien-thuc" },
    { path: "gioi-thieu" },
    ...ALL.map((it) => ({ path: `hang-hoa/${it.slug}` })),
    ...knowledge.map((d) => ({ path: `kien-thuc/${d.slug}`, lastmod: fmt(d.data.updated) })),
    ...posts.map((p) => ({ path: `phan-tich/${p.slug}`, lastmod: fmt(p.data.date) }))
  ];

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries
      .map((e) => {
        const loc = e.path ? `${SITE}/${e.path}/` : `${SITE}/`;
        const lm = e.lastmod ? `\n    <lastmod>${e.lastmod}</lastmod>` : "";
        return `  <url>\n    <loc>${loc}</loc>${lm}\n  </url>`;
      })
      .join("\n") +
    `\n</urlset>\n`;

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" }
  });
};
