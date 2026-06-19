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
  { url: "https://news.google.com/rss/search?q=(coffee+OR+sugar+OR+cocoa)+(analysis+OR+forecast+OR+outlook)+when:7d&hl=en-US&gl=US&ceid=US:en", source: "Google News", hint: "soft", google: true },
  // VĨ MÔ / ĐỊA CHÍNH TRỊ / CHÍNH SÁCH TIỀN TỆ — yếu tố ẢNH HƯỞNG GIÁ hàng hóa
  { url: "https://news.google.com/rss/search?q=(Federal+Reserve+OR+interest+rate+OR+inflation+OR+US+dollar)+(commodities+OR+gold+OR+oil)+when:7d&hl=en-US&gl=US&ceid=US:en", source: "Google News", hint: "macro", google: true },
  { url: "https://news.google.com/rss/search?q=(OPEC+OR+sanctions+OR+%22Middle+East%22+OR+Russia+OR+Ukraine)+(oil+OR+supply+OR+commodity)+when:7d&hl=en-US&gl=US&ceid=US:en", source: "Google News", hint: "energy", google: true },
  { url: "https://news.google.com/rss/search?q=(tariff+OR+%22trade+war%22+OR+%22China+demand%22+OR+geopolitical)+(commodity+OR+commodities+OR+metals)+when:7d&hl=en-US&gl=US&ceid=US:en", source: "Google News", hint: "macro", google: true }
];

const MAX_PER_FEED = 6;   // số tin lấy mỗi nguồn
const MAX_TOTAL = 50;     // tổng số tin giữ lại

// --- Keyword -> category (để gắn nhãn màu) ---
const CATEGORY_RULES = [
  ["energy", ["oil", "crude", "brent", "wti", "gas", "lng", "opec", "fuel", "diesel", "gasoline"]],
  ["metal",  ["gold", "silver", "copper", "platinum", "iron ore", "aluminum", "aluminium", "zinc", "nickel", "lead", "tin", "lme", "metal"]],
  ["soft",   ["coffee", "sugar", "cocoa", "cotton", "rubber", "arabica", "robusta"]],
  ["agri",   ["corn", "soybean", "soy", "wheat", "grain", "crop", "harvest", "planting"]],
  ["macro",  ["fed", "inflation", "dollar", "rate", "cpi", "economy", "gdp"]]
];

// Nguồn "dự báo tự đăng lại" (broker tự làm mới bài liên tục, lặp & ít giá trị) — chặn hẳn.
const BLOCK_SOURCES = ["litefinance", "liteforex", "litemarkets"];
function isBlockedSource(src) {
  const s = (src || "").toLowerCase();
  return BLOCK_SOURCES.some(b => s.includes(b));
}

// Lọc tiêu đề "rác" từ Google News (trang báo giá, bảng giá — không phải bài viết)
function isJunkTitle(t) {
  const s = (t || "").trim();
  if (s.length < 22) return true; // quá ngắn → thường là trang báo giá ("Soybean", "Gold")
  if (/price today|spot price|price chart|live price|price per|prices today|quote|charts?$/i.test(s)) return true;
  // Bài "dự báo tự đăng lại" kiểu mẫu (broker làm mới liên tục) — vd LiteFinance:
  if (/for today,?\s*tomorrow/i.test(s)) return true;                          // "...for today, tomorrow, next week"
  if (/(forecast|prediction)[^.]{0,40}\bnext\s+\d+\s+days?/i.test(s)) return true;  // "...forecast ... next 30 days"
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

// --- ID ổn định cho mỗi tin (djb2 + XOR) — để trang đọc nội bộ tìm theo ?id.
//     Hàm này được CHÉP Y HỆT sang client (doc.astro, tin-tuc.astro, index.astro)
//     nên mọi thay đổi phải đồng bộ cả hai nơi. ---
function makeId(s) {
  s = String(s || "");
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";

// Loại ảnh "rác" của Google News (logo Google, không phải ảnh bài thật).
const BAD_IMG = /gstatic\.com|\/\/(?:www\.)?google\.com|news\.google|lh\d+\.googleusercontent/i;

// Chạy song song có GIỚI HẠN (tránh dội request làm nguồn chặn IP).
async function mapLimit(arr, limit, fn) {
  const out = new Array(arr.length);
  let i = 0;
  async function worker() {
    while (i < arr.length) { const idx = i++; out[idx] = await fn(arr[idx], idx); }
  }
  await Promise.all(Array.from({ length: Math.min(limit, arr.length) }, worker));
  return out;
}

// --- Giải mã link Google News -> URL bài GỐC ---
// Link RSS của Google News là dạng mã hoá (news.google.com/rss/articles/CBM...),
// fetch thẳng chỉ ra vỏ ứng dụng Google, không có nội dung bài. Cơ chế giải mã:
//   1) GET trang để lấy chữ ký (data-n-a-sg) + mốc thời gian (data-n-a-ts)
//   2) POST batchexecute -> trả về URL bài thật
// Nhờ vậy mới lấy được tóm tắt/ảnh để dịch, và nút "đọc bản gốc" trỏ đúng báo.
// Lỗi/timeout/định dạng đổi -> trả lại link gốc (web vẫn chạy bình thường).
async function resolveGoogleUrl(url) {
  if (!/news\.google\.[^/]+\/(rss\/)?articles\//.test(url)) return url;
  try {
    const id = url.match(/articles\/([^?]+)/)[1];
    const ctrl1 = new AbortController();
    const t1 = setTimeout(() => ctrl1.abort(), 8000);
    const page = await (await fetch(url, { headers: { "User-Agent": UA }, signal: ctrl1.signal })).text();
    clearTimeout(t1);
    const sg = page.match(/data-n-a-sg="([^"]+)"/);
    const ts = page.match(/data-n-a-ts="([^"]+)"/);
    if (!sg || !ts) return url;
    const inner = ["garturlreq", [["X", "X", ["X", "X"], null, null, 1, 1, "US:en", null, 1, null, null, null, null, null, 0, 1], "X", "X", 1, [1, 1, 1], 1, 1, null, 0, 0, null, 0], id, Number(ts[1]), sg[1]];
    const body = "f.req=" + encodeURIComponent(JSON.stringify([[["Fbv4je", JSON.stringify(inner), null, "generic"]]]));
    const ctrl2 = new AbortController();
    const t2 = setTimeout(() => ctrl2.abort(), 8000);
    const res = await fetch("https://news.google.com/_/DotsSplashUi/data/batchexecute", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8", "User-Agent": UA },
      body, signal: ctrl2.signal
    });
    clearTimeout(t2);
    const txt = await res.text();
    const m = txt.match(/https?:\/\/(?!news\.google)[^"\\]+/);
    return m ? m[0] : url;
  } catch {
    return url; // giải mã thất bại -> giữ link Google (vẫn bấm đọc được)
  }
}

// --- Lấy đoạn trích + ảnh từ trang gốc (og:description / og:image) ---
// CHỈ lấy phần meta mô tả mà nhà xuất bản công khai cho chia sẻ (dùng đoạn
// trích ngắn + LUÔN dẫn nguồn = đúng chuẩn tổng hợp tin, không sao chép cả bài).
async function fetchOg(url) {
  if (!url) return {};
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 7000);
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      redirect: "follow", signal: ctrl.signal
    });
    clearTimeout(timer);
    if (!res.ok) return {};
    const html = (await res.text()).slice(0, 250000);
    const meta = (prop) => {
      const re1 = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']*)["']`, "i");
      const re2 = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${prop}["']`, "i");
      const m = html.match(re1) || html.match(re2);
      return m ? decode(m[1]) : "";
    };
    const image = meta("og:image");
    return {
      desc: (meta("og:description") || meta("description")).slice(0, 320),
      image: image && !BAD_IMG.test(image) ? image : ""
    };
  } catch {
    return {}; // lỗi/timeout → bỏ qua, không chặn bot
  }
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
      .filter(it => !isJunkTitle(it.title) && !isBlockedSource(it.source))   // bỏ tiêu đề rác + nguồn spam
      .slice(0, MAX_PER_FEED);
  } catch (e) {
    console.warn(`! Bỏ qua nguồn ${feed.source}: ${e.message}`);
    return [];
  }
}

// Định dạng giờ theo MÚI GIỜ VIỆT NAM (UTC+7, không có DST), bất kể máy chạy ở
// đâu — GitHub Actions chạy giờ UTC nên nếu dùng getHours() sẽ lệch 7 tiếng,
// khiến web hiện giờ cũ → tưởng tin không cập nhật. Cộng 7h rồi đọc theo UTC.
function fmtVN(d) {
  if (isNaN(d)) return "";
  const vn = new Date(d.getTime() + 7 * 3600 * 1000);
  const p = n => String(n).padStart(2, "0");
  return `${vn.getUTCFullYear()}-${p(vn.getUTCMonth() + 1)}-${p(vn.getUTCDate())} ${p(vn.getUTCHours())}:${p(vn.getUTCMinutes())}`;
}

function fmtDate(s) {
  const d = new Date(s);
  if (isNaN(d)) return s || "";
  return fmtVN(d);
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

  // Dedupe theo tiêu đề VÀ đường link (bắt cả bản sao cùng bài từ nhiều nguồn).
  const seenT = new Set(), seenL = new Set();
  const unique = raw.filter(it => {
    if (!it.title) return false;
    const t = it.title.toLowerCase();
    const l = (it.link || "").trim();
    if (seenT.has(t)) return false;
    if (l && seenL.has(l)) return false;
    seenT.add(t); if (l) seenL.add(l);
    return true;
  }).slice(0, MAX_TOTAL);

  // Giải link Google News -> URL bài gốc, rồi lấy đoạn trích + ảnh từ trang gốc.
  // Chạy song song có giới hạn để không bị nguồn chặn; lỗi thì bỏ qua từng tin.
  console.log(`→ ${unique.length} tin: giải link Google News & lấy đoạn trích từ trang gốc...`);
  const enriched = await mapLimit(unique, 6, async (it) => {
    const link = await resolveGoogleUrl(it.link);
    const og = await fetchOg(link);
    return { it, link, og };
  });

  console.log("→ Đang dịch sang tiếng Việt...");
  const items = [];
  for (const { it, link, og } of enriched) {
    const desc = it.desc || og.desc || "";
    const title_vi = await translate(it.title);
    const summary_vi = desc ? await translate(desc) : "";
    items.push({
      id: makeId(link || it.title),
      title: it.title,
      title_vi,
      summary_vi,
      image: og.image || "",
      link,
      source: it.source,
      category: categorize(it.title + " " + desc, it.hint),
      published: fmtDate(it.pub)
    });
  }

  const out = {
    updated_at: fmtVN(new Date()),   // giờ Việt Nam, khớp đồng hồ người xem
    items
  };

  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(out, null, 2), "utf8");
  console.log(`✓ Đã ghi ${items.length} tin vào ${OUT}`);
}

main().catch(e => { console.error("✗ Lỗi:", e); process.exit(1); });
