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

import { readFile, writeFile, mkdir } from "node:fs/promises";
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
const GEMINI_MODEL = "gemini-2.0-flash";
const GROQ_MODEL = "llama-3.3-70b-versatile";

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

// ── Chọn tin để viết ─────────────────────────────────────────────────────────

async function loadUsedIds() {
  try { return new Set(JSON.parse(await readFile(USED_PATH, "utf8"))); }
  catch { return new Set(); }
}

async function pickNews(items, usedIds) {
  const ok = (it, needImg) =>
    ALLOWED_CATS.has(it.category) &&
    (it.summary_vi || "").trim().length > 40 &&
    (!needImg || (it.image || "").trim()) &&
    !usedIds.has(it.id);
  const byNew = (a, b) => String(b.published).localeCompare(String(a.published));
  // Ưu tiên tin có ảnh; nếu không có thì nới lỏng.
  const withImg = items.filter((it) => ok(it, true)).sort(byNew);
  if (withImg.length) return withImg[0];
  const noImg = items.filter((it) => ok(it, false)).sort(byNew);
  return noImg[0] || null;
}

// ── Lời nhắc (prompt) gửi cho AI ─────────────────────────────────────────────

function buildPrompt(it) {
  const catName = { energy: "Năng lượng", metal: "Kim loại", agri: "Nông sản", soft: "Nguyên liệu công nghiệp" }[it.category] || "Hàng hóa";
  return `Bạn là chuyên gia phân tích thị trường hàng hóa, viết cho người Việt trên website "Bến Hàng Hóa".
Hãy viết MỘT bài phân tích ngắn (khoảng 450–600 từ) bằng TIẾNG VIỆT, dựa trên bản tin dưới đây.

BẢN TIN GỐC:
- Tiêu đề: ${it.title_vi}
- Nội dung: ${it.summary_vi}
- Nguồn: ${it.source}
- Nhóm hàng: ${catName}

YÊU CẦU CẤU TRÚC — đúng khung 6 khối, mỗi khối có tiêu đề in đậm:
1) Một câu chốt mở đầu, bắt đầu bằng dòng in đậm dạng "**📊 NHẬN ĐỊNH [TÊN HÀNG] — [ngày hôm nay]**".
2) **Chuyện gì vừa xảy ra** — tóm tắt tin.
3) **Vì sao quan trọng** — tác động lên cung/cầu/dòng tiền.
4) **Góc nhìn nhiều chiều** — nêu CẢ mặt tăng VÀ mặt giảm (cân bằng, không một chiều).
5) **Mức cần theo dõi** — chỉ nói ĐỊNH TÍNH (vùng tâm lý, xu hướng). TUYỆT ĐỐI KHÔNG bịa con số giá cụ thể; ghi rõ "cần đối chiếu biểu đồ trực tiếp để xác định mốc chính xác".
6) **Theo dõi tiếp** — sự kiện sắp tới cần canh.

QUY TẮC BẮT BUỘC:
- KHÔNG khuyên mua/bán dứt khoát. KHÔNG hứa hẹn lợi nhuận.
- Kết bài bằng ĐÚNG câu này: "*Bến Hàng Hóa | Thông tin mang tính tham khảo, không phải khuyến nghị đầu tư.*"
- Giọng chuyên nghiệp, dễ hiểu, không sáo rỗng.

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
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
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

// ── Tách kết quả AI theo các dấu === ─────────────────────────────────────────

function parseAI(text) {
  const grab = (tag, next) => {
    const re = new RegExp(`===${tag}===\\s*([\\s\\S]*?)\\s*(?:===${next}===|$)`, "i");
    const m = text.match(re);
    return m ? m[1].trim() : "";
  };
  return {
    title: grab("TITLE", "SUMMARY"),
    summary: grab("SUMMARY", "BODY"),
    body: grab("BODY", "CAPTIONS"),
    captions: grab("CAPTIONS", "ZZZ"),
  };
}

// ── Ghi bản nháp ra file ─────────────────────────────────────────────────────

async function writeDraft(provider, it, parsed) {
  const { ymd } = todayParts();
  const title = parsed.title || it.title_vi;
  const slug = `${ymd}-${slugify(title)}`;
  const summary = (parsed.summary || it.summary_vi).replace(/\s+/g, " ").trim();
  const summaryBlock = summary.match(/.{1,90}(\s|$)/g)?.map((l) => "  " + l.trim()).join("\n") || "  " + summary;

  const md = `---
title: ${yamlTitle(title)}
date: ${ymd}T08:00
category: ${it.category}
image: ${it.image || ""}
summary: >-
${summaryBlock}

  Bến Hàng Hóa | Tham khảo, không phải khuyến nghị đầu tư.
---
> ⚠️ **BẢN NHÁP do ${provider} (AI miễn phí) viết — CHƯA đăng web.** Hãy đọc lại,
> điền mốc giá thật (mở TradingView), xóa dòng cảnh báo này, rồi mới chuyển vào
> src/content/posts/ để đăng.

${parsed.body || "(AI không trả về nội dung)"}
`;

  const fanpage = `CAPTION FANPAGE — bài "${title}"  (do ${provider} soạn)
Copy thủ công lên Fanpage. KHÔNG dán vào file bài web.
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
  const news = JSON.parse(await readFile(NEWS_PATH, "utf8"));
  const usedIds = await loadUsedIds();
  const it = await pickNews(news.items || [], usedIds);
  if (!it) { console.log("ℹ️ Không có tin mới phù hợp để viết hôm nay."); return; }

  console.log(`📰 Chọn tin: [${it.category}] ${it.title_vi}`);
  const prompt = buildPrompt(it);

  const providers = [["gemini", callGemini], ["groq", callGroq]];
  const written = [];
  for (const [name, fn] of providers) {
    try {
      const raw = await fn(prompt);
      if (raw == null) { console.log(`⏭️  Bỏ qua ${name} (thiếu chìa khóa).`); continue; }
      const parsed = parseAI(raw);
      if (!parsed.body) { console.log(`⚠️ ${name} trả về sai định dạng — bỏ.`); continue; }
      const file = await writeDraft(name, it, parsed);
      written.push(file);
      console.log(`✅ ${name} → drafts/${file}`);
    } catch (e) {
      console.log(`❌ ${name} lỗi: ${e.message}`);
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
