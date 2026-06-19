// ============================================================================
//  TỰ SOẠN NHÁP BÀI PHÂN TÍCH (PA-A — bản chạy trên mây, AI miễn phí)
// ----------------------------------------------------------------------------
//  Mỗi sáng (GitHub Actions gọi) script này:
//    1. Đọc tin nóng trong public/data/news.json
//    2. Nhờ AI MIỄN PHÍ (Gemini + Groq) viết bài + 4 caption Fanpage
//    3. Lưu BẢN NHÁP vào thư mục drafts/  (KHÔNG nằm trong src/content → KHÔNG
//       tự lên web). Bạn mở ra duyệt, sửa mốc giá, rồi mới đăng.
//
//  ⚠️ Chạy trên mây KHÔNG mở được TradingView → AI được lệnh KHÔNG bịa số giá.
//  ⚠️ Cần 2 "chìa khóa" đặt trong biến môi trường: GEMINI_API_KEY, GROQ_API_KEY
//     (thiếu cái nào thì bỏ qua AI đó, không làm hỏng cả job).
// ============================================================================

import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Đường dẫn gốc dự án — fileURLToPath xử lý đúng cả đường dẫn có dấu tiếng Việt.
const ROOT = fileURLToPath(new URL("..", import.meta.url));
const NEWS_PATH = ROOT + "public/data/news.json";
const DRAFTS_DIR = ROOT + "drafts";
const USED_PATH = DRAFTS_DIR + "/.used-ids.json";

// Chỉ viết cho 4 nhóm hàng web đang theo dõi (bỏ qua tin vĩ mô lan man).
const ALLOWED_CATS = new Set(["energy", "metal", "agri", "soft"]);

// Model miễn phí — đổi tên ở đây nếu nhà cung cấp ra bản mới.
// Thử lần lượt các model Gemini free — mỗi model có hạn mức riêng, dùng cái nào còn quota.
const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash"];
const GROQ_MODEL = "llama-3.3-70b-versatile";
// Thứ tự ƯU TIÊN họ model khi tự chọn model free từ OpenRouter (tốt cho tiếng Việt trước).
const OPENROUTER_PREFER = ["deepseek", "qwen", "llama-3.3", "mistral", "gemini-2.0-flash", "llama-3.1"];

// ── Tiện ích ────────────────────────────────────────────────────────────────

// Bỏ dấu tiếng Việt → tạo slug sạch (dùng cho tên file + URL).
function slugify(s) {
  return String(s || "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d").replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60).replace(/-+$/g, "");
}

function todayParts() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return { ymd: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}` };
}

// Bọc tiêu đề trong nháy đơn cho YAML (an toàn với dấu ':' và '"').
function yamlTitle(t) {
  return "'" + String(t).replace(/'/g, "''").trim() + "'";
}

// Bỏ dấu + viết thường để so khớp từ khóa chủ đề.
function norm(s) {
  return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
}

// ── Chọn tin để viết ─────────────────────────────────────────────────────────

async function loadUsedIds() {
  try { return new Set(JSON.parse(await readFile(USED_PATH, "utf8"))); }
  catch { return new Set(); }
}

async function pickNews(items, usedIds, topic) {
  const ok = (it, needImg) =>
    ALLOWED_CATS.has(it.category) &&
    (it.summary_vi || "").trim().length > 40 &&
    (!needImg || (it.image || "").trim()) &&
    !usedIds.has(it.id);
  const byNew = (a, b) => String(b.published).localeCompare(String(a.published));
  // Nếu bạn yêu cầu chủ đề: trước hết thử khớp ĐÚNG MẶT HÀNG (cả tên Anh lẫn Việt,
  // khớp trọn từ) — tránh lỗi "back"/"comeback" bị tính nhầm thành "bạc".
  if (topic) {
    const subj = resolveTopicSubject(topic);
    if (subj) {
      const hit = items.filter((it) => ok(it, false) && detectSubject(it) === subj).sort(byNew);
      if (hit.length) { console.log(`🎯 Khớp mặt hàng "${subj}": ${hit.length} tin.`); return hit[0]; }
      console.log(`⚠️ Hiện không có tin nào về "${subj}" — dùng tin nóng nhất thay thế.`);
    } else {
      // Chủ đề tự do (không phải mặt hàng đã biết): khớp TRỌN TỪ trên nội dung.
      const t = norm(topic).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(`\\b${t}\\b`, "i");
      const hit = items.filter((it) => ok(it, false) && re.test(norm(`${it.title_vi} ${it.summary_vi} ${it.title}`))).sort(byNew);
      if (hit.length) return hit[0];
      console.log(`⚠️ Không thấy tin nào khớp chủ đề "${topic}" — dùng tin nóng nhất thay thế.`);
    }
  }
  // Ưu tiên tin có ảnh; nếu không có thì nới lỏng.
  const withImg = items.filter((it) => ok(it, true)).sort(byNew);
  if (withImg.length) return withImg[0];
  const noImg = items.filter((it) => ok(it, false)).sort(byNew);
  return noImg[0] || null;
}

// Nhận diện MẶT HÀNG cụ thể của một tin → để GOM các tin cùng mặt hàng lại,
// giúp AI tổng hợp nhiều nguồn thay vì chỉ dựa 1 bài (khớp cả tên Anh lẫn Việt).
const SUBJECT_KW = {
  "dầu thô":         ["oil", "crude", "brent", "wti", "petroleum", "dầu thô", "dầu"],
  "khí đốt":         ["natural gas", "lng", "khí đốt", "khí tự nhiên"],
  "vàng":            ["gold", "bullion", "vàng"],
  "bạc":             ["silver", "bạc"],
  "đồng":            ["copper", "đồng đỏ"],
  "bạch kim":        ["platinum", "palladium", "bạch kim"],
  "nhôm":            ["aluminum", "aluminium", "nhôm"],
  "nickel":          ["nickel", "niken"],
  "thép & quặng sắt":["iron ore", "steel", "rebar", "thép", "quặng sắt"],
  "cà phê":          ["coffee", "arabica", "robusta", "cà phê"],
  "đường":           ["sugar", "đường thô"],
  "ca cao":          ["cocoa", "ca cao"],
  "bông":            ["cotton", "bông"],
  "cao su":          ["rubber", "cao su"],
  "ngô":             ["corn", "maize", "ngô", "bắp"],
  "đậu tương":       ["soybean", "soy", "đậu tương", "đậu nành"],
  "lúa mì":          ["wheat", "lúa mì"],
};
const SUBJECT_RE = Object.entries(SUBJECT_KW).map(([name, kws]) => [
  name,
  kws.map((k) => new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}s?\\b`, "i")),
]);
// Chọn mặt hàng NỔI BẬT NHẤT: khớp ở tiêu đề tính nặng (×3), hòa thì lấy mã xuất
// hiện SỚM NHẤT trong tiêu đề. Nhờ vậy tin "Bạc tăng khi vàng giảm" → chủ đề là
// BẠC chứ không bị "vàng" (đứng trước trong danh sách) nuốt mất.
function detectSubject(it) {
  const title = `${it.title || ""} ${it.title_vi || ""}`;
  const body = `${it.summary_vi || ""}`;
  let best = null, bestScore = 0, bestPos = Infinity;
  for (const [name, res] of SUBJECT_RE) {
    let s = 0, pos = Infinity;
    for (const re of res) {
      const m = title.match(re);
      if (m) { s += 3; if (m.index < pos) pos = m.index; }
      if (re.test(body)) s += 1;
    }
    if (s > bestScore || (s === bestScore && s > 0 && pos < bestPos)) {
      best = name; bestScore = s; bestPos = pos;
    }
  }
  return best;
}

// Khớp chủ đề bạn GÕ → một MẶT HÀNG đã biết (vd "bạc"/"silver" → bạc; "dầu" → dầu thô).
// Nhờ vậy lọc tin theo đúng mặt hàng (trọn từ) thay vì so chuỗi con dễ nhầm (back→bac).
function resolveTopicSubject(topic) {
  const t = norm(topic);
  if (!t) return null;
  for (const [name, kws] of Object.entries(SUBJECT_KW)) {
    if (norm(name) === t || norm(name).split(" ").includes(t)) return name;   // khớp tên mặt hàng (Việt)
    if (kws.some((k) => norm(k) === t)) return name;                          // khớp từ khóa (silver, gold...)
  }
  return null;
}

// Gom 1 "chùm tin": 1 tin CHÍNH + các tin LIÊN QUAN cùng mặt hàng (hoặc cùng nhóm
// hàng nếu không nhận diện được mặt hàng). Để AI có bức tranh tổng thể mà tổng hợp.
async function pickCluster(items, usedIds, topic) {
  const primary = await pickNews(items, usedIds, topic);
  if (!primary) return null;
  const subject = detectSubject(primary);
  const byNew = (a, b) => String(b.published).localeCompare(String(a.published));
  const isRel = (it) => {
    if (it.id === primary.id) return false;
    if ((it.summary_vi || "").trim().length < 30) return false;
    return subject ? detectSubject(it) === subject : it.category === primary.category;
  };
  const related = items.filter(isRel).sort(byNew).slice(0, 5);   // tối đa 5 tin liên quan
  return { primary, related, subject };
}

// ── Lời nhắc (prompt) gửi cho AI ─────────────────────────────────────────────

function buildPrompt(cluster, focus) {
  const { primary: it, related, subject } = cluster;
  const catName = { energy: "Năng lượng", metal: "Kim loại", agri: "Nông sản", soft: "Nguyên liệu công nghiệp" }[it.category] || "Hàng hóa";
  const d = new Date();
  const dateVN = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  const hangLabel = subject ? subject.toUpperCase() : catName;

  // Liệt kê các tin liên quan để AI ĐỐI CHIẾU (không chỉ tóm tắt 1 tin).
  const relatedBlock = related.length
    ? related.map((r, i) => `  (${i + 1}) ${r.title_vi}\n      ${(r.summary_vi || "").replace(/\s+/g, " ").slice(0, 220)}  — [Nguồn: ${r.source}]`).join("\n")
    : "  (Không có tin liên quan khác — chỉ phân tích từ bản tin chính bên trên.)";

  return `Bạn là chuyên gia phân tích thị trường hàng hóa, viết cho người Việt trên website "Bến Hàng Hóa".
Hãy viết MỘT bài phân tích ngắn (khoảng 500–650 từ) bằng TIẾNG VIỆT${subject ? ` về ${subject}` : ""}.

⚠️ QUAN TRỌNG: Đây KHÔNG phải bài tóm tắt một tin. Bạn được cung cấp NHIỀU bản tin
cùng chủ đề. Hãy TỔNG HỢP chúng lại thành MỘT bức tranh chung — chỉ ra điểm các nguồn
ĐỒNG THUẬN, điểm TRÁI CHIỀU, và rút ra nhận định tổng thể của riêng bạn. KHÔNG liệt kê
từng tin một cách rời rạc.

BẢN TIN CHÍNH:
- Tiêu đề: ${it.title_vi}
- Nội dung: ${it.summary_vi}
- Nguồn: ${it.source}
- Nhóm hàng: ${catName}

CÁC BẢN TIN LIÊN QUAN (cùng chủ đề — dùng để đối chiếu, bổ sung bức tranh tổng thể):
${relatedBlock}

YÊU CẦU CẤU TRÚC — đúng khung 6 khối, mỗi tiêu đề khối in đậm nằm trên MỘT DÒNG RIÊNG (nội dung xuống dòng dưới):
1) Một câu chốt mở đầu, bắt đầu bằng dòng in đậm dạng "**📊 NHẬN ĐỊNH ${hangLabel} — ${dateVN}**".
2) **Bức tranh chung** — TỔNG HỢP diễn biến nổi bật từ các tin trên (nêu được nhiều khía cạnh, không chỉ 1 tin).
3) **Vì sao quan trọng** — tác động lên cung/cầu/dòng tiền.
4) **Góc nhìn nhiều chiều** — nêu CẢ mặt tăng VÀ mặt giảm; nếu các nguồn mâu thuẫn nhau thì chỉ rõ.
5) **Mức cần theo dõi** — chỉ nói ĐỊNH TÍNH (vùng tâm lý, xu hướng). TUYỆT ĐỐI KHÔNG bịa con số giá cụ thể; ghi rõ "cần đối chiếu biểu đồ trực tiếp để xác định mốc chính xác".
6) **Theo dõi tiếp** — sự kiện sắp tới cần canh.

QUY TẮC BẮT BUỘC:
- CHỈ dùng thông tin có trong các bản tin trên. TUYỆT ĐỐI KHÔNG bịa số liệu, % hay con số giá không có trong tin.
- KHÔNG khuyên mua/bán dứt khoát. KHÔNG hứa hẹn lợi nhuận.
- Kết bài bằng ĐÚNG câu này: "*Bến Hàng Hóa | Thông tin mang tính tham khảo, không phải khuyến nghị đầu tư.*"
- Giọng chuyên nghiệp, dễ hiểu, không sáo rỗng.
${focus ? `\n⭐ TRỌNG TÂM — hãy nhấn mạnh và phân tích sâu phần này hơn cả: ${focus}\n` : ""}

Sau bài viết, tạo 4 CAPTION FANPAGE ngắn (mỗi cái 3–5 dòng, có emoji, kết bằng CTA "Để lại SĐT hoặc nhắn Zalo 083 795 5858 — tư vấn miễn phí"):
  (a) bản nhận định, (b) bản nhấn vào MỘT con số, (c) bản nêu mốc/ngưỡng cần canh, (d) bản câu hỏi tương tác.

TRẢ KẾT QUẢ ĐÚNG ĐỊNH DẠNG SAU (giữ nguyên các dòng có dấu ===):
===TITLE===
(tiêu đề giật tít, có emoji)
===SUMMARY===
(2–3 câu tóm tắt cho phần mô tả)
===BODY===
(toàn bộ bài viết, định dạng markdown)
===CAPTIONS===
(4 caption, ngăn cách nhau bằng một dòng chỉ gồm: ----)`;
}

// ── Gọi từng nhà cung cấp AI ─────────────────────────────────────────────────

async function callGemini(prompt) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  let lastErr = "";
  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });
      if (!res.ok) { lastErr = `${model}: HTTP ${res.status}`; continue; }
      const data = await res.json();
      const txt = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
      if (txt.trim()) { console.log(`   (Gemini dùng model: ${model})`); return txt; }
      lastErr = `${model}: rỗng`;
    } catch (e) { lastErr = `${model}: ${e.message}`; }
  }
  throw new Error(`Gemini không model free nào chạy được (cuối: ${lastErr})`);
}

async function callGroq(prompt) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: GROQ_MODEL, messages: [{ role: "user", content: prompt }], temperature: 0.7 }),
  });
  if (!res.ok) throw new Error(`Groq HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content || "";
}

// Hỏi OpenRouter danh sách model đang FREE (giá = 0), sắp theo thứ tự ưu tiên.
async function listFreeOpenRouterModels(key) {
  const res = await fetch("https://openrouter.ai/api/v1/models", { headers: { authorization: `Bearer ${key}` } });
  if (!res.ok) return [];
  const { data } = await res.json();
  const free = (data || []).filter(
    (m) => m.pricing && Number(m.pricing.prompt) === 0 && Number(m.pricing.completion) === 0
  );
  const score = (id) => {
    const i = OPENROUTER_PREFER.findIndex((p) => id.toLowerCase().includes(p));
    return i === -1 ? 99 : i;
  };
  return free.map((m) => m.id).sort((a, b) => score(a) - score(b));
}

async function callOpenRouter(prompt) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return null;
  // Tự lấy model free hiện có (không hardcode slug → không bao giờ lỗi "model đã bị gỡ").
  const candidates = await listFreeOpenRouterModels(key);
  if (!candidates.length) throw new Error("OpenRouter: không lấy được model free nào (kiểm tra cài đặt Privacy?)");
  let lastErr = "";
  for (const model of candidates.slice(0, 8)) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${key}`,
          "HTTP-Referer": "https://benhanghoa.com",
          "X-Title": "Ben Hang Hoa",
        },
        body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], temperature: 0.7 }),
      });
      if (!res.ok) { lastErr = `${model}: HTTP ${res.status}`; continue; }
      const data = await res.json();
      // R1 hay chèn phần suy luận trong <think>...</think> — lọc bỏ cho bài sạch.
      const content = (data?.choices?.[0]?.message?.content || "").replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
      if (content) { console.log(`   (OpenRouter dùng model: ${model})`); return content; }
      lastErr = `${model}: rỗng`;
    } catch (e) { lastErr = `${model}: ${e.message}`; }
  }
  throw new Error(`OpenRouter không model free nào chạy được (cuối: ${lastErr})`);
}

// ── Tách kết quả AI theo các dấu === ─────────────────────────────────────────

function parseAI(text) {
  // Tìm các nhãn ===TAG=== một cách "khoan dung": AI free hay viết lệch, ví dụ
  // "===CAPTIONS----" thay vì "===CAPTIONS===". Bắt theo dòng có >=2 dấu '=' rồi
  // tới tên nhãn, nuốt mọi ký tự thừa phía sau (---- hoặc ===). Nội dung mỗi
  // khối = đoạn nằm giữa nhãn này và nhãn kế tiếp.
  const tags = ["TITLE", "SUMMARY", "BODY", "CAPTIONS"];
  const found = [];
  for (const tag of tags) {
    const m = text.match(new RegExp(`={2,}\\s*${tag}\\b[^\\n]*`, "i"));
    if (m) found.push({ key: tag.toLowerCase(), start: m.index, end: m.index + m[0].length });
  }
  found.sort((a, b) => a.start - b.start);
  const out = { title: "", summary: "", body: "", captions: "" };
  for (let i = 0; i < found.length; i++) {
    const cur = found[i], next = found[i + 1];
    out[cur.key] = text.slice(cur.end, next ? next.start : undefined).trim();
  }
  return out;
}

// ── Ghi bản nháp ra file ─────────────────────────────────────────────────────

// Chọn ảnh minh họa từ kho public/assets/fanpage/ — ưu tiên ảnh RIÊNG mặt hàng
// (vd vang.jpg), không có thì ảnh theo NHÓM (vd kim-loai.jpg). Bạn chỉ cần bỏ
// file ảnh vào thư mục là code TỰ nhận, không phải sửa gì thêm.
const CAT_IMG = { energy: "nang-luong", metal: "kim-loai", agri: "nong-san", soft: "nguyen-lieu", macro: "vi-mo" };
function libraryImage(subject, category) {
  const bases = [];
  if (subject) bases.push(slugify(subject));
  if (CAT_IMG[category]) bases.push(CAT_IMG[category]);
  for (const base of bases)
    for (const ext of ["jpg", "jpeg", "png", "webp"])
      if (existsSync(`${ROOT}public/assets/fanpage/${base}.${ext}`)) return `/assets/fanpage/${base}.${ext}`;
  return "";
}

async function writeDraft(provider, cluster, parsed) {
  const it = cluster.primary;
  const libImg = libraryImage(cluster.subject, it.category);
  const articleImage = libImg || it.image || "";          // ảnh kho > ảnh nguồn
  const imgSlug = cluster.subject ? slugify(cluster.subject) : (CAT_IMG[it.category] || "chung");
  const { ymd } = todayParts();
  const title = parsed.title || it.title_vi;
  const slug = `${ymd}-${slugify(title)}`;
  const summary = (parsed.summary || it.summary_vi).replace(/\s+/g, " ").trim();
  const summaryBlock = summary.match(/.{1,90}(\s|$)/g)?.map((l) => "  " + l.trim()).join("\n") || "  " + summary;

  // Liệt kê nguồn đã tổng hợp → bạn kiểm chứng được bài dựa trên những tin nào.
  const sources = [it, ...cluster.related];
  const srcList = sources.map((s) => `>   • ${s.title_vi} — ${s.source}`).join("\n");

  const md = `---
title: ${yamlTitle(title)}
date: ${ymd}T08:00
category: ${it.category}
image: ${articleImage}
summary: >-
${summaryBlock}

  Bến Hàng Hóa | Tham khảo, không phải khuyến nghị đầu tư.
---
> ⚠️ **BẢN NHÁP do ${provider} (AI miễn phí) viết — CHƯA đăng web.** Hãy đọc lại,
> điền mốc giá thật (mở TradingView), xóa dòng cảnh báo này, rồi mới chuyển vào
> src/content/posts/ để đăng.
>
> 🧩 **Tổng hợp từ ${sources.length} bản tin${cluster.subject ? ` về ${cluster.subject}` : ""}:**
${srcList}

${parsed.body || "(AI không trả về nội dung)"}
`;

  const imgLine = libImg
    ? `📷 ẢNH ĐÍNH KÈM (đã có trong kho): public${libImg}`
    : `📷 ẢNH ĐÍNH KÈM: chưa có ảnh cho mục này — thêm file vào: public/assets/fanpage/${imgSlug}.jpg`;
  const fanpage = `CAPTION FANPAGE — bài "${title}"  (do ${provider} soạn)
Copy thủ công lên Fanpage. KHÔNG dán vào file bài web.
${imgLine}
   → Nếu bài cần BIỂU ĐỒ/đồ thị: tự vẽ (mở TradingView) rồi upload thay ảnh này.
============================================================

${parsed.captions || "(AI không trả về caption)"}
`;

  await mkdir(DRAFTS_DIR, { recursive: true });
  await writeFile(`${DRAFTS_DIR}/${slug}.${provider}.md`, md, "utf8");
  await writeFile(`${DRAFTS_DIR}/${slug}.${provider}.fanpage.txt`, fanpage, "utf8");
  return `${slug}.${provider}.md`;
}

// ── Chạy chính ───────────────────────────────────────────────────────────────

async function main() {
  if (!existsSync(NEWS_PATH)) { console.log("⚠️ Chưa có news.json — bỏ qua."); return; }
  const topic = (process.env.TOPIC || "").trim();   // chủ đề bạn gõ khi bấm Run workflow
  const focus = (process.env.FOCUS || "").trim();   // trọng tâm bạn muốn nhấn

  // Lần chạy TỰ ĐỘNG (theo lịch): nếu hôm nay đã có nháp thì bỏ qua (tránh 2 slot dự phòng tạo trùng).
  const { ymd } = todayParts();
  if (process.env.GITHUB_EVENT_NAME === "schedule" && !topic) {
    const today = (await readdir(DRAFTS_DIR).catch(() => [])).filter((f) => f.startsWith(ymd) && f.endsWith(".md"));
    if (today.length) { console.log(`ℹ️ Hôm nay đã có ${today.length} bản nháp — lần chạy theo lịch này bỏ qua.`); return; }
  }

  const news = JSON.parse(await readFile(NEWS_PATH, "utf8"));
  const usedIds = await loadUsedIds();
  const cluster = await pickCluster(news.items || [], usedIds, topic);
  if (!cluster) { console.log("ℹ️ Không có tin mới phù hợp để viết hôm nay."); return; }
  const it = cluster.primary;

  if (topic) console.log(`🎯 Chủ đề yêu cầu: ${topic}`);
  if (focus) console.log(`⭐ Trọng tâm: ${focus}`);
  console.log(`📰 Tin chính: [${it.category}] ${it.title_vi}`);
  console.log(`🧩 Tổng hợp thêm ${cluster.related.length} tin liên quan${cluster.subject ? ` về ${cluster.subject}` : ` (cùng nhóm ${it.category})`}.`);
  const prompt = buildPrompt(cluster, focus);

  const providers = [["gemini", callGemini], ["groq", callGroq], ["openrouter", callOpenRouter]];
  const written = [];
  for (const [name, fn] of providers) {
    try {
      const raw = await fn(prompt);
      if (raw == null) { console.log(`⏭️  Bỏ qua ${name} (thiếu chìa khóa).`); continue; }
      const parsed = parseAI(raw);
      if (!parsed.body) { console.log(`⚠️ ${name} trả về sai định dạng — bỏ.`); continue; }
      const file = await writeDraft(name, cluster, parsed);
      written.push(file);
      console.log(`✅ ${name} → drafts/${file}`);
    } catch (e) {
      // 429 / hết quota free là chuyện BÌNH THƯỜNG của AI miễn phí — bỏ qua êm,
      // KHÔNG coi là lỗi (các nhà cung cấp khác vẫn viết được nháp như thường).
      const hetLuot = /HTTP 429|quota|rate.?limit|hết hạn mức/i.test(e.message);
      if (hetLuot) console.log(`⏭️  Bỏ qua ${name} (tạm hết lượt free hôm nay) — không sao, AI khác vẫn viết.`);
      else console.log(`❌ ${name} lỗi: ${e.message}`);
    }
  }

  if (written.length) {
    usedIds.add(it.id);
    await writeFile(USED_PATH, JSON.stringify([...usedIds], null, 0), "utf8");
    console.log(`\n🎉 Đã tạo ${written.length} bản nháp trong drafts/. Mở ra duyệt rồi đăng.`);
  } else {
    console.log("\n⚠️ Không tạo được bản nháp nào (kiểm tra chìa khóa AI).");
  }
}

main().catch((e) => { console.error("Lỗi nghiêm trọng:", e); process.exit(1); });
