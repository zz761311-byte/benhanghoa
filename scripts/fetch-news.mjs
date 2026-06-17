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
// google:true → là Google News RSS: lấy tên báo thật từ thẻ <source>, cắt đuôi " - Tên báo".
const FEEDS = [
  // Nguồn trực tiếp (bài viết đầy đủ, có tóm tắt)
  { url: "https://oilprice.com/rss/main", source: "OilPrice", hint: "energy" },
  { url: "https://www.mining.com/feed/", source: "Mining.com", hint: "metal" },
  { url: "https://dailycoffeenews.com/feed/", source: "Daily Coffee News", hint: "soft" },
  // Google News RSS — lọc theo nhóm hàng hóa (ổn định, phủ rộng cả 4 nhóm)
  { url: "https://news.google.com/rss/search?q=(crude+oil+OR+natural+gas+OR+gasoline)+price+when:7d&hl=en-US&gl=US&ceid=US:en", source: "Google News", hint: "energy", google: true },
  { url: "https://news.google.com/rss/search?q=(gold+OR+silver+OR+copper+OR+platinum+OR+aluminum+OR+nickel)+price+when:7d&hl=en-US&gl=US&ceid=US:en", source: "Google News", hint: "metal", google: true },
  { url: "https://news.google.com/rss/search?q=(corn+OR+soybean+OR+wheat+OR+grain)+price+when:7d&hl=en-US&gl=US&ceid=US:en", source: "Google News", hint: "agri", google: true },
  { url: "https://news.google.com/rss/search?q=(coffee+OR+sugar+OR+cocoa+OR+cotton+OR+rubber)+price+when:7d&hl=en-US&gl=US&ceid=US:en", source: "Google News", hint: "soft", google: true },
  // Google News RSS — PHÂN TÍCH / NHẬN ĐỊNH chuyên sâu (forecast/outlook) theo nhóm
  { url: "https://news.google.com/rss/search?q=(crude+oil+OR+natural+gas)+(analysis+OR+forecast+OR+outlook)+when:7d&hl=en-US&gl=US&ceid=US:en", source: "Google News", hint: "energy", google: true },
  { url: "https://news.google.com/rss/search?q=(gold+OR+silver+OR+copper+OR+platinum)+(analysis+OR+forecast+OR+outlook)+when:7d&hl=en-US&gl=US&ceid=US:en", source: "Google News", hint: "metal", google: true },
  { url: "https://news.google.com/rss/search?q=(corn+OR+soybean+OR+wheat)+(analysis+OR+forecast+OR+outlook)+when:7d&hl=en-US&gl=US&ceid=US:en", source: "Google News", hint: "agri", google: true },
  { url: "https://news.google.com/rss/search?q=(coffee+OR+sugar+OR+cocoa)+(analysis+OR+forecast+OR+outlook)+when:7d&hl=en-US&gl=US&ceid=US:en", source: "Google News", hint: "soft", google: true }
];

const MAX_PER_FEED = 6;   // số tin lấy mỗi nguồn
const MAX_TOTAL = 30;     // tổng số tin giữ lại

// --- Keyword -> category (để gắn nhãn màu) ---
const CATEGORY_RULES = [
  ["energy", ["oil", "crude", "brent", "wti", "gas", "lng", "opec", "fuel", "diesel", "gasoline"]],
  ["metal",  ["gold", "silver", "copper", "platinum", "iron ore", "aluminum", "aluminium", "zinc", "nickel", "lead", "tin", "lme", "metal"]],
  ["soft",   ["coffee", "sugar", "cocoa", "cotton", "rubber", "arabica", "robusta"]],
  ["agri",   ["corn", "soybean", "soy", "wheat", "grain", "crop", "harvest", "planting"]],
  ["macro",  ["fed", "inflation", "dollar", "rate", "cpi", "economy", "gdp"]]
];

// Lọc tiêu đề "rác" từ Google News (trang báo giá, bảng giá — không phải bài viết)
function isJunkTitle(t) {
  const s = (t || "").trim();
  if (s.length < 22) return true; // quá ngắn → thường là trang báo giá ("Soybean", "Gold")
  if (/price today|spot price|price chart|live price|price per|prices today|quote|charts?$/i.test(s)) return true;
  return false;
}

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
      src: decode(pick(block, "source")),   // Google News: tên báo gốc
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
    return parseFeed(xml)
      .map(it => {
        let title = it.title;
        let source = feed.source;
        let desc = it.desc;
        if (feed.google) {
          source = it.src || feed.source;                  // tên báo thật
          title = title.replace(/\s+-\s+[^-]+$/, "").trim(); // bỏ đuôi " - Tên báo"
          desc = "";                                        // GNews không có tóm tắt thật → bỏ
        }
        return { ...it, title, desc, source, hint: feed.hint };
      })
      .filter(it => !isJunkTitle(it.title))   // bỏ tiêu đề rác trước khi cắt
      .slice(0, MAX_PER_FEED);
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
  const perFeed = await Promise.all(FEEDS.map(fetchFeed));
  // Trộn xoay vòng (round-robin): lấy lần lượt 1 tin mỗi nguồn → mọi nhóm đều có mặt
  // dù sau đó có cắt bớt ở MAX_TOTAL.
  const raw = [];
  const maxLen = Math.max(0, ...perFeed.map(a => a.length));
  for (let i = 0; i < maxLen; i++) {
    for (const arr of perFeed) if (arr[i]) raw.push(arr[i]);
  }

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
