// ============================================================
// Bến Hàng Hóa — News bot (zero dependency, Node 18+)
// 1. Fetch free RSS feeds about commodities
// 2. Translate title/summary EN -> VI (free Google endpoint)
// 3. Categorize by keywords
// 4. Write ../public/data/news.json (Astro phục vụ từ thư mục public/)
//
// Run locally:   node scripts/fetch-news.mjs
// In CI:         see .github/workflows/fetch-news.yml
//
// LƯU Ý (vi): bản dịch dùng endpoint dịch miễn phí, không chính thức —
// hợp cho giai đoạn khung. Khi cần ổn định/chất lượng cao hãy đổi sang
// API dịch chính thức hoặc dùng AI dịch + tóm tắt.
// ============================================================

import { writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../public/data/news.json");

// --- Free RSS sources (chỉnh thêm/bớt tùy ý) ---
const FEEDS = [
  { url: "https://oilprice.com/rss/main", source: "OilPrice", hint: "energy" },
  { url: "https://www.mining.com/feed/", source: "Mining.com", hint: "metal" },
  { url: "https://www.investing.com/rss/commodities_Metals.rss", source: "Investing", hint: "metal" },
  { url: "https://www.investing.com/rss/commodities_Energy.rss", source: "Investing", hint: "energy" },
  { url: "https://www.investing.com/rss/commodities_Agriculture.rss", source: "Investing", hint: "agri" }
];

const MAX_PER_FEED = 6;   // số tin lấy mỗi nguồn
const MAX_TOTAL = 30;     // tổng số tin giữ lại

// --- Keyword -> category (để gắn nhãn màu) ---
const CATEGORY_RULES = [
  ["energy", ["oil", "crude", "brent", "wti", "gas", "lng", "opec", "fuel", "diesel", "gasoline"]],
  ["metal",  ["gold", "silver", "copper", "platinum", "iron ore", "aluminum", "aluminium", "zinc", "nickel", "lead", "tin", "lme", "metal"]],
  ["agri",   ["corn", "soybean", "soy", "wheat", "grain", "crop", "harvest", "planting"]],
  ["soft",   ["coffee", "sugar", "cocoa", "cotton", "rubber", "arabica", "robusta"]],
  ["macro",  ["fed", "inflation", "dollar", "rate", "cpi", "economy", "gdp"]]
];

function categorize(text, hint) {
  const t = (text || "").toLowerCase();
  for (const [cat, kws] of CATEGORY_RULES) {
    if (kws.some(k => t.includes(k))) return cat;
  }
  return hint || "macro";
}

// --- Minimal RSS parsing (no XML dependency) ---
function decode(s) {
  return (s || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ").trim();
}
function pick(block, tag) {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? m[1] : "";
}
function parseFeed(xml) {
  const items = [];
  const matches = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  for (const block of matches) {
    items.push({
      title: decode(pick(block, "title")),
      link: decode(pick(block, "link")) || (block.match(/<link[^>]*href="([^"]+)"/i)?.[1] || ""),
      desc: decode(pick(block, "description")).slice(0, 280),
      pub: decode(pick(block, "pubDate"))
    });
  }
  return items;
}

// --- Free translation EN -> VI ---
async function translate(text) {
  if (!text) return "";
  try {
    const url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q="
      + encodeURIComponent(text.slice(0, 1500));
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    return (data[0] || []).map(seg => seg[0]).join("");
  } catch {
    return text; // fallback: giữ nguyên tiếng Anh nếu dịch lỗi
  }
}

async function fetchFeed(feed) {
  try {
    const res = await fetch(feed.url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const xml = await res.text();
    return parseFeed(xml).slice(0, MAX_PER_FEED).map(it => ({ ...it, source: feed.source, hint: feed.hint }));
  } catch (e) {
    console.warn(`! Bỏ qua nguồn ${feed.source}: ${e.message}`);
    return [];
  }
}

function fmtDate(s) {
  const d = new Date(s);
  if (isNaN(d)) return s || "";
  const p = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

async function main() {
  console.log("→ Đang lấy tin từ", FEEDS.length, "nguồn...");
  const raw = (await Promise.all(FEEDS.map(fetchFeed))).flat();

  // Dedupe by title.
  const seen = new Set();
  const unique = raw.filter(it => {
    const k = it.title.toLowerCase();
    if (!it.title || seen.has(k)) return false;
    seen.add(k);
    return true;
  }).slice(0, MAX_TOTAL);

  console.log(`→ ${unique.length} tin, đang dịch sang tiếng Việt...`);
  const items = [];
  for (const it of unique) {
    const title_vi = await translate(it.title);
    const summary_vi = it.desc ? await translate(it.desc) : "";
    items.push({
      title: it.title,
      title_vi,
      summary_vi,
      link: it.link,
      source: it.source,
      category: categorize(it.title + " " + it.desc, it.hint),
      published: fmtDate(it.pub)
    });
  }

  const now = new Date();
  const p = n => String(n).padStart(2, "0");
  const out = {
    updated_at: `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())} ${p(now.getHours())}:${p(now.getMinutes())}`,
    items
  };

  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(out, null, 2), "utf8");
  console.log(`✓ Đã ghi ${items.length} tin vào ${OUT}`);
}

main().catch(e => { console.error("✗ Lỗi:", e); process.exit(1); });
