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

import { readFile, writeFile, mkdir } from "node:fs/promises";
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
  { url: "https://news.google.com/rss/search?q=(silver+OR+copper+OR+platinum+OR+palladium+OR+aluminum+OR+nickel)+price+when:7d&hl=en-US&gl=US&ceid=US:en", source: "Google News", hint: "metal", google: true },
  { url: "https://news.google.com/rss/search?q=(corn+OR+soybean+OR+wheat+OR+grain)+price+when:7d&hl=en-US&gl=US&ceid=US:en", source: "Google News", hint: "agri", google: true },
  { url: "https://news.google.com/rss/search?q=(coffee+OR+sugar+OR+cocoa+OR+cotton+OR+rubber)+price+when:7d&hl=en-US&gl=US&ceid=US:en", source: "Google News", hint: "soft", google: true },
  // Google News RSS — PHÂN TÍCH / NHẬN ĐỊNH chuyên sâu (forecast/outlook) theo nhóm
  { url: "https://news.google.com/rss/search?q=(crude+oil+OR+natural+gas)+(analysis+OR+forecast+OR+outlook)+when:7d&hl=en-US&gl=US&ceid=US:en", source: "Google News", hint: "energy", google: true },
  { url: "https://news.google.com/rss/search?q=(silver+OR+copper+OR+platinum+OR+palladium)+(analysis+OR+forecast+OR+outlook)+when:7d&hl=en-US&gl=US&ceid=US:en", source: "Google News", hint: "metal", google: true },
  { url: "https://news.google.com/rss/search?q=(corn+OR+soybean+OR+wheat)+(analysis+OR+forecast+OR+outlook)+when:7d&hl=en-US&gl=US&ceid=US:en", source: "Google News", hint: "agri", google: true },
  { url: "https://news.google.com/rss/search?q=(coffee+OR+sugar+OR+cocoa)+(analysis+OR+forecast+OR+outlook)+when:7d&hl=en-US&gl=US&ceid=US:en", source: "Google News", hint: "soft", google: true },
  // KIM LOẠI GIAO DỊCH ĐƯỢC Ở VN (bạc / bạch kim / đồng) — feed RIÊNG từng mã.
  // Vàng chưa được phép đầu tư qua sàn nên KHÔNG gộp vàng vào đây; tách riêng để
  // 3 mã này có đủ lượng tin, không bị tin vàng (vốn rất nhiều) lấn át.
  { url: "https://news.google.com/rss/search?q=silver+(price+OR+forecast+OR+outlook+OR+demand+OR+rally+OR+%22industrial+demand%22)+when:7d&hl=en-US&gl=US&ceid=US:en", source: "Google News", hint: "metal", google: true },
  { url: "https://news.google.com/rss/search?q=(platinum+OR+palladium)+(price+OR+forecast+OR+outlook+OR+demand+OR+supply)+when:7d&hl=en-US&gl=US&ceid=US:en", source: "Google News", hint: "metal", google: true },
  { url: "https://news.google.com/rss/search?q=copper+(price+OR+forecast+OR+outlook+OR+demand+OR+supply+OR+LME)+when:7d&hl=en-US&gl=US&ceid=US:en", source: "Google News", hint: "metal", google: true },
  // VĨ MÔ / ĐỊA CHÍNH TRỊ / CHÍNH SÁCH TIỀN TỆ — yếu tố ẢNH HƯỞNG GIÁ hàng hóa
  { url: "https://news.google.com/rss/search?q=(Federal+Reserve+OR+interest+rate+OR+inflation+OR+US+dollar)+(commodities+OR+gold+OR+oil)+when:7d&hl=en-US&gl=US&ceid=US:en", source: "Google News", hint: "macro", google: true },
  { url: "https://news.google.com/rss/search?q=(OPEC+OR+sanctions+OR+%22Middle+East%22+OR+Russia+OR+Ukraine)+(oil+OR+supply+OR+commodity)+when:7d&hl=en-US&gl=US&ceid=US:en", source: "Google News", hint: "energy", google: true },
  { url: "https://news.google.com/rss/search?q=(tariff+OR+%22trade+war%22+OR+%22China+demand%22+OR+geopolitical)+(commodity+OR+commodities+OR+metals)+when:7d&hl=en-US&gl=US&ceid=US:en", source: "Google News", hint: "macro", google: true }
];

const MAX_PER_FEED = 6;   // số tin lấy mỗi nguồn
const MAX_TOTAL = 50;     // tổng số tin giữ lại
const MAX_GOLD = 4;       // VÀNG không giao dịch được trên sàn VN → giữ tối đa 4 tin (chỉ làm bối cảnh)

// Nhận diện tin VÀNG để giới hạn (vàng không phải mặt hàng giao dịch được ở VN).
function isGold(it) {
  const en = String(it.title || "");
  const vi = String(it.title_vi || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  return /\bgold\b|\bbullion\b|\bxau\b/i.test(en) || /\bvang\b/.test(vi);
}

// --- Keyword -> category (để gắn nhãn màu) ---
// Khớp TRỌN TỪ (word-boundary) để tránh bắt nhầm chuỗi con:
//   "golden" KHÔNG còn bị tính là "gold", "continue" không bị tính là "tin",
//   "leading" không bị tính là "lead", "gasoline" không bị tính là "gas".
const CATEGORY_KW = {
  energy: ["oil", "crude", "brent", "wti", "gas", "natural gas", "lng", "opec", "fuel", "diesel", "gasoline",
           "nuclear", "uranium", "electricity", "power grid", "petroleum", "refinery"],
  metal:  ["gold", "silver", "copper", "platinum", "palladium", "iron ore", "aluminum", "aluminium",
           "zinc", "nickel", "lead", "tin", "lme", "steel", "bullion", "metal"],
  soft:   ["coffee", "sugar", "cocoa", "cotton", "rubber", "arabica", "robusta"],
  agri:   ["corn", "soybean", "soy", "wheat", "grain", "crop", "harvest", "planting", "livestock", "cattle", "hog"],
  macro:  ["federal reserve", "fed", "central bank", "ecb",
           "interest rate", "rate hike", "rate cut", "rate decision", "monetary policy",
           "inflation", "deflation", "cpi", "ppi", "gdp", "recession", "economy", "economic",
           "dollar", "greenback", "dxy", "treasury yield", "bond yield",
           "tariff", "trade war", "trade deal", "sanctions", "geopolitical",
           "stimulus", "debt ceiling", "jobs report", "payrolls", "unemployment", "election"],
};
// 4 nhóm HÀNG HÓA cụ thể được ưu tiên hơn "macro" (macro chỉ là phương án chót).
const PRODUCT_CATS = ["energy", "metal", "soft", "agri"];
// Biên dịch sẵn regex \btừ-khóas?\b (cho phép số nhiều: metals, oils, futures...).
const CATEGORY_RE = Object.fromEntries(
  Object.entries(CATEGORY_KW).map(([cat, kws]) => [
    cat,
    kws.map((kw) => new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}s?\\b`, "i")),
  ])
);

// Nguồn "dự báo tự đăng lại" (broker tự làm mới bài liên tục, lặp & ít giá trị) — chặn hẳn.
const BLOCK_SOURCES = ["litefinance", "liteforex", "litemarkets"];
function isBlockedSource(src) {
  const s = (src || "").toLowerCase();
  return BLOCK_SOURCES.some(b => s.includes(b));
}

// Báo cáo "nghiên cứu thị trường" tự sinh hàng loạt (rỗng, chỉ để bán report) —
// vd "World ... - Market Analysis, Forecast, Size, Trends and Insights". Dấu hiệu:
// LIỆT KÊ >=3 từ lóng báo cáo cùng lúc, hoặc có "CAGR"/"Forecast to 20xx".
// Bài phân tích/dự báo THẬT chỉ có 1–2 từ này → KHÔNG bị chặn.
function isMarketReportSpam(t) {
  const s = String(t || "").toLowerCase();
  if (/\bcagr\b/.test(s)) return true;
  if (/forecast (to|till|until|period)\b/.test(s)) return true;
  if (/\bmarket (research )?report\b/.test(s)) return true;
  const jargon = ["market analysis", "market size", "market share", "forecast", "trend",
                  "insight", "outlook", "segmentation", "revenue", "growth rate", "industry analysis"];
  let n = 0;
  for (const w of jargon) if (s.includes(w)) n++;
  return n >= 3;
}

// Lọc tiêu đề "rác" từ Google News (trang báo giá, bảng giá — không phải bài viết)
function isJunkTitle(t) {
  const s = (t || "").trim();
  if (s.length < 22) return true; // quá ngắn → thường là trang báo giá ("Soybean", "Gold")
  if (/price today|spot price|price chart|live price|price per|prices today|quote|charts?$/i.test(s)) return true;
  // Trang cập nhật giá theo ngày (vd "Current price of silver as of Tuesday, June 16")
  if (/^current price of\b/i.test(s)) return true;
  if (/\bas of \w+day\b/i.test(s)) return true;                 // "...as of Tuesday/Monday..."
  if (/\boverview$/i.test(s)) return true;                      // "Palladium Overview"
  // Bài "dự báo tự đăng lại" kiểu mẫu (broker làm mới liên tục) — vd LiteFinance:
  if (/for today,?\s*tomorrow/i.test(s)) return true;                          // "...for today, tomorrow, next week"
  if (/(forecast|prediction)[^.]{0,40}\bnext\s+\d+\s+days?/i.test(s)) return true;  // "...forecast ... next 30 days"
  if (isMarketReportSpam(s)) return true;                                          // báo cáo nghiên cứu thị trường rác
  return false;
}

function countHits(text, res) {
  let n = 0;
  for (const re of res) if (re.test(text)) n++;
  return n;
}

// Phân loại theo "CHỦ ĐỀ NẰM Ở ĐÂU" — từ khóa ở TIÊU ĐỀ nặng gấp 3 lần mô tả.
// Quy tắc giúp tab "Vĩ mô" bám sát, không nuốt nhầm tin hàng hóa và ngược lại:
//   • Tiêu đề có ĐÚNG 1 mặt hàng cụ thể  → đó là chủ đề (vd "Vàng giảm khi Fed..."
//     = Kim loại; Fed chỉ là nguyên nhân, không phải chủ đề).
//   • Tiêu đề KHÔNG có mặt hàng nào, chỉ có Fed/lạm phát/thuế quan → Vĩ mô.
//   • Tiêu đề có NHIỀU mặt hàng + yếu tố vĩ mô → tin thị trường rộng → Vĩ mô.
// `hint` (gợi ý từ nguồn / nhãn cũ) là chốt chặn cuối, giữ tin cũ không bị phá nhãn.
function categorize(title, desc, hint) {
  const t = (title || "").toLowerCase();
  const d = (desc || "").toLowerCase();
  const sc = {};
  for (const cat of Object.keys(CATEGORY_KW)) {
    sc[cat] = countHits(t, CATEGORY_RE[cat]) * 3 + countHits(d, CATEGORY_RE[cat]);
  }
  // Các nhóm hàng hóa cụ thể XUẤT HIỆN NGAY TRONG TIÊU ĐỀ (tín hiệu chủ đề thật).
  const titleProducts = PRODUCT_CATS.filter((c) => countHits(t, CATEGORY_RE[c]) > 0);
  const bestProduct = () => {
    let b = null, bs = 0;
    for (const c of PRODUCT_CATS) if (sc[c] > bs) { b = c; bs = sc[c]; }   // hòa điểm → nhóm đứng trước
    return b;
  };

  if (titleProducts.length === 1) return titleProducts[0];           // 1 mặt hàng = chủ đề
  if (titleProducts.length >= 2) return sc.macro > 0 ? "macro" : bestProduct();  // nhiều mặt hàng

  // Tiêu đề không có mặt hàng cụ thể nào:
  if (sc.macro > 0) return "macro";                                  // tin vĩ mô thuần
  const bp = bestProduct();
  if (bp && sc[bp] > 0) return bp;                                   // mặt hàng chỉ nằm ở mô tả
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

// --- Sửa lỗi dịch máy cho thuật ngữ tài chính/hàng hóa ---
// Google dịch theo nghĩa thường ngày → sai trong ngữ cảnh thị trường.
// Mỗi rule CHỈ áp dụng khi từ tiếng Anh gốc khớp điều kiện (tránh sửa nhầm tin
// chính trị thật). Các lỗi dưới đây đã được kiểm chứng bằng cách dịch thử qua
// chính endpoint Google này — không phải phỏng đoán.
function fixFinanceTranslation(vi, enSource) {
  if (!vi) return vi;
  const en = (enSource || "").toLowerCase();
  let out = vi;

  // 1) "rally" (danh từ) bị dịch nhầm thành "biểu tình" (vd "relief rally" →
  //    "cuộc biểu tình cứu trợ"). Chỉ sửa khi CÓ "rally" và KHÔNG phải tin biểu
  //    tình/chính trị thật. ("rally" động từ: rallies/rallied → Google dịch đúng.)
  const hasRally = /\brall(y|ies|ied|ying)\b/.test(en);
  const looksProtest = /\b(protest|demonstrat|march|election|campaign|government|anti-|streets|voters|coup)\b/.test(en);
  if (hasRally && !looksProtest) {
    out = out.replace(/cuộc biểu tình/gi, "đợt tăng giá").replace(/biểu tình/gi, "tăng giá");
  }
  // 2) "Main Street" → "phố chính" (sai). Nghĩa: nền kinh tế thực/người dân-doanh nghiệp.
  if (/\bmain street\b/.test(en)) out = out.replace(/phố chính/gi, "nền kinh tế thực");
  // 3) "weigh(s/ed) on" → "cân nhắc" (sai). Nghĩa: gây áp lực/đè nặng lên.
  if (/\bweigh(s|ed)?\s+on\b/.test(en)) {
    out = out.replace(/cân nhắc về/gi, "gây áp lực lên").replace(/cân nhắc đối với/gi, "gây áp lực lên");
  }
  // 4) "greenback" (tiếng lóng của USD) → "đồng bạc xanh" (khó hiểu) → đồng USD.
  if (/\bgreenback\b/.test(en)) out = out.replace(/đồng bạc xanh/gi, m => (m[0] === "Đ" ? "Đồng USD" : "đồng USD"));

  return out;
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
    const vi = (data[0] || []).map(seg => seg[0]).join("");
    return fixFinanceTranslation(vi, text); // sửa lỗi thuật ngữ trước khi trả về
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

// --- Lọc tin GẦN TRÙNG (cùng sự kiện, khác nguồn/cách giật tít) ---
// Dùng độ tương đồng Jaccard trên tập từ khóa của tiêu đề (cả Anh lẫn Việt).
// Ngưỡng đặt CAO (0.40) một cách có chủ đích: dữ liệu thật cho thấy tin trùng và
// tin chỉ "liên quan" có điểm sát nhau → hạ thấp sẽ giấu nhầm tin khác nhau.
// Thà thỉnh thoảng còn 1 cặp gần giống, hơn là xóa nhầm tin thật.
const DEDUP_STOP = new Set("the a an of to in on for and or as at by is are be with from over after amid into vs về của và là một những các đã sẽ khi do bị được cho giá".split(/\s+/));
function dedupTokens(s) {
  return String(s || "").toLowerCase()
    .replace(/[-–—|].*$/, "")                 // bỏ đuôi sau dấu gạch/sổ (thường là tên nguồn)
    .replace(/[^a-z0-9à-ỹ\s]/gi, " ")
    .split(/\s+/).filter(w => w.length > 2 && !DEDUP_STOP.has(w));
}
function jaccard(a, b) {
  const A = new Set(a), B = new Set(b);
  if (!A.size || !B.size) return 0;
  let inter = 0; for (const x of A) if (B.has(x)) inter++;
  return inter / (A.size + B.size - inter);
}
const DEDUP_T = 0.40;
function dropNearDuplicates(list) {
  const kept = [], out = [];
  for (const it of list) {
    const te = dedupTokens(it.title), tv = dedupTokens(it.title_vi);
    let dup = false;
    for (const k of kept) {
      if (k.category !== it.category) continue;   // chỉ gộp trong cùng nhóm hàng (an toàn thêm)
      if (Math.max(jaccard(te, k.te), jaccard(tv, k.tv)) >= DEDUP_T) { dup = true; break; }
    }
    if (!dup) { kept.push({ category: it.category, te, tv }); out.push(it); }
  }
  return out;
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
  const fresh = raw.filter(it => {
    if (!it.title) return false;
    const t = it.title.toLowerCase();
    const l = (it.link || "").trim();
    if (seenT.has(t)) return false;
    if (l && seenL.has(l)) return false;
    seenT.add(t); if (l) seenL.add(l);
    return true;
  });

  // GỘP với tin đã có (news.json cũ) → tin KHÔNG "biến mất" khi rớt khỏi feed Google,
  // và chỉ phải dịch tin MỚI (đỡ gọi API → đỡ bị chặn). Lọc lại tin cũ qua bộ chặn spam.
  let oldItems = [];
  try { oldItems = (JSON.parse(await readFile(OUT, "utf8")).items || []); } catch {}
  oldItems = oldItems.filter(o => o && o.title && !isBlockedSource(o.source) && !isJunkTitle(o.title));
  // Phân loại LẠI tin cũ theo luật mới (sửa nhãn sai đã lỡ lưu). Truyền category cũ
  // làm `hint` → tin nào tiêu đề không có từ khóa rõ thì GIỮ nguyên nhãn cũ, không phá.
  // ...và vá lại lỗi dịch thuật ngữ đã lỡ lưu (rally→biểu tình, Main Street→phố chính...).
  // Dùng tiêu đề tiếng Anh `o.title` làm ngữ cảnh guard.
  oldItems = oldItems.map(o => ({
    ...o,
    category: categorize(o.title, o.summary_vi || "", o.category),
    title_vi: fixFinanceTranslation(o.title_vi || "", o.title),
    summary_vi: fixFinanceTranslation(o.summary_vi || "", o.title)
  }));
  const oldTitles = new Set(oldItems.map(o => o.title.toLowerCase()));
  const oldLinks = new Set(oldItems.map(o => (o.link || "").trim()).filter(Boolean));

  // Chỉ xử lý (giải link + lấy ảnh + dịch) các tin THỰC SỰ MỚI, ưu tiên mới nhất, tối đa MAX_TOTAL.
  const tsRaw = (it) => { const d = new Date(it.pub); return isNaN(d) ? 0 : d.getTime(); };
  const toProcess = fresh
    .filter(it => !oldTitles.has(it.title.toLowerCase()))
    .sort((a, b) => tsRaw(b) - tsRaw(a))
    .slice(0, MAX_TOTAL);
  console.log(`→ ${toProcess.length} tin mới cần xử lý (giữ lại ${oldItems.length} tin cũ)...`);
  const enriched = await mapLimit(toProcess, 6, async (it) => {
    const link = await resolveGoogleUrl(it.link);
    const og = await fetchOg(link);
    return { it, link, og };
  });

  console.log("→ Đang dịch tin mới sang tiếng Việt...");
  const newItems = [];
  for (const { it, link, og } of enriched) {
    if (link && oldLinks.has(link.trim())) continue; // sau khi giải link mà trùng bài cũ → bỏ
    const desc = it.desc || og.desc || "";
    const title_vi = await translate(it.title);
    const summary_vi = desc ? await translate(desc) : "";
    newItems.push({
      id: makeId(link || it.title),
      title: it.title,
      title_vi,
      summary_vi,
      image: og.image || "",
      link,
      source: it.source,
      category: categorize(it.title, desc, it.hint),
      published: fmtDate(it.pub)
    });
  }

  // Gộp mới + cũ → bỏ trùng id → SẮP THEO NGÀY MỚI NHẤT → giữ 50 tin gần nhất.
  const seenId = new Set();
  let goldKept = 0;
  const tsOf = (x) => { const d = new Date(String(x.published).replace(" ", "T")); return isNaN(d) ? 0 : d.getTime(); };
  const byId = [...newItems, ...oldItems]
    .filter(x => { if (seenId.has(x.id)) return false; seenId.add(x.id); return true; })
    .sort((a, b) => tsOf(b) - tsOf(a));            // mới nhất trước → giữ bản mới nhất của cặp trùng
  const deduped = dropNearDuplicates(byId);        // gộp tin gần trùng (cùng sự kiện, khác nguồn)
  if (deduped.length < byId.length) console.log(`→ Gộp ${byId.length - deduped.length} tin gần trùng (cùng sự kiện).`);
  const items = deduped
    .filter(x => { if (isGold(x)) { if (goldKept >= MAX_GOLD) return false; goldKept++; } return true; })  // giới hạn cứng tin vàng
    .slice(0, MAX_TOTAL);

  const out = {
    updated_at: fmtVN(new Date()),   // giờ Việt Nam, khớp đồng hồ người xem
    items
  };

  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(out, null, 2), "utf8");
  console.log(`✓ Đã ghi ${items.length} tin (${newItems.length} mới) vào ${OUT}`);
}

main().catch(e => { console.error("✗ Lỗi:", e); process.exit(1); });
