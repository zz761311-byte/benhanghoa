// Quét các bài ĐÃ ĐĂNG (src/content/posts/) tìm: ngôn ngữ khuyến nghị giao dịch,
// "số bịa độ chính xác", và bài THIẾU disclaimer. Bổ khuyết cho việc bộ lọc trong
// draft-article.mjs chỉ chạy trên bài nháp AI — bài viết tay trước đây lọt lưới.
//
// Chạy: node scripts/check-posts.mjs   (thoát mã 1 nếu có cảnh báo → dùng làm cổng CI)
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIR = join(ROOT, "src", "content", "posts");

// PHẢI khớp với draft-article.mjs
const FORBIDDEN_RE = /chốt lời|stop[\s-]?loss|cắt lỗ|điểm vào|vào lệnh|mua (gần|quanh|ở|vào|tại)|bán (gần|quanh|ở|ra|tại)|lời khuyên|khuyến nghị (mua|bán)|nên mua|nên bán|take[\s-]?profit/i;
const FAKE_PRECISION_RE = /±\s*\d|biên độ sai số|sai số\s*(là|khoảng|±|:)?\s*\d|khoảng tin cậy|độ tin cậy\s*\d|xác suất\s*(khoảng\s*)?\d{1,3}\s*%|\d{1,3}\s*%\s*(xác suất|khả năng|độ tin cậy)|độ chính xác\s*\d{1,3}\s*%/i;
// Ngôn ngữ "quyết định giao dịch" ngôi thứ nhất — dấu hiệu tư vấn trá hình
const TRADING_VOICE_RE = /\b(vị thế (mua|bán|short|long)|tôi (sẽ |đang )?(mua|bán|vào lệnh|chốt|quyết định)|trước khi (có )?hành động)\b/i;
const DISCLAIMER_RE = /không phải khuyến nghị đầu tư/i;

function scan(re, text) {
  const hits = [];
  for (const line of String(text || "").split("\n")) {
    const m = line.match(re);
    if (m) hits.push(m[0].trim());
  }
  return [...new Set(hits)];
}

const files = (await readdir(DIR)).filter((f) => f.endsWith(".md"));
let problems = 0;

for (const f of files) {
  const raw = await readFile(join(DIR, f), "utf8");
  const body = raw.replace(/^---[\s\S]*?---/, ""); // bỏ frontmatter khi quét nội dung
  const issues = [];
  const fb = scan(FORBIDDEN_RE, body);
  if (fb.length) issues.push(`🚨 KHUYẾN NGHỊ giao dịch: ${fb.join(", ")}`);
  const fp = scan(FAKE_PRECISION_RE, body);
  if (fp.length) issues.push(`⚠️  SỐ BỊA độ chính xác: ${fp.join(", ")}`);
  const tv = scan(TRADING_VOICE_RE, body);
  if (tv.length) issues.push(`🗣️  GIỌNG tư vấn cá nhân: ${tv.join(", ")}`);
  if (!DISCLAIMER_RE.test(raw)) issues.push(`📜 THIẾU disclaimer "không phải khuyến nghị đầu tư"`);

  if (issues.length) {
    problems++;
    console.log(`\n❌ ${f}`);
    for (const i of issues) console.log(`   ${i}`);
  }
}

console.log(`\n${"=".repeat(50)}`);
if (problems) {
  console.log(`⚠️  ${problems}/${files.length} bài có vấn đề — kiểm/sửa trước khi đăng.`);
  process.exit(1);
} else {
  console.log(`✅ ${files.length} bài đều sạch (không khuyến nghị, không số bịa, có disclaimer).`);
}
