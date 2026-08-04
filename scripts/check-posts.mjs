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
// Lưu ý: số thập phân tiếng Việt dùng dấu phẩy (40,7%). Phải cho phép phần thập phân,
// nếu không biểu thức sẽ cắt "40,7%" thành "7%" rồi báo nhầm là số bịa.
const SO_PHAN_TRAM = String.raw`\d{1,3}(?:[.,]\d+)?\s*%`;
const FAKE_PRECISION_RE = new RegExp(
  [
    String.raw`±\s*\d`,
    "biên độ sai số",
    String.raw`sai số\s*(là|khoảng|±|:)?\s*\d`,
    "khoảng tin cậy",
    String.raw`độ tin cậy\s*\d`,
    String.raw`xác suất\s*(khoảng\s*)?${SO_PHAN_TRAM}`,
    String.raw`${SO_PHAN_TRAM}\s*(xác suất|khả năng|độ tin cậy)`,
    String.raw`độ chính xác\s*${SO_PHAN_TRAM}`,
  ].join("|"),
  "i"
);
// Ngôn ngữ "quyết định giao dịch" ngôi thứ nhất — dấu hiệu tư vấn trá hình
const TRADING_VOICE_RE = /\b(vị thế (mua|bán|short|long)|tôi (sẽ |đang )?(mua|bán|vào lệnh|chốt|quyết định)|trước khi (có )?hành động)\b/i;
const DISCLAIMER_RE = /không phải khuyến nghị đầu tư/i;

// Những cụm dưới đây TRÔNG như lời khuyên mua bán nhưng thật ra chỉ là MÔ TẢ
// thị trường, nên phải bỏ ra trước khi quét — không thì bài nào cũng bị báo nhầm,
// nhìn mãi thành quen rồi bỏ qua cả cảnh báo thật.
//
// ⚠️ Chỉ thêm vào đây cụm CHẮC CHẮN là mô tả. Ví dụ giữ nguyên "nên bán",
// "cơ hội mua vào" — đó là lời khuyên thật, phải báo.
const MO_TA_THI_TRUONG = [
  /chiều (mua vào|bán ra)/gi,           // giá doanh nghiệp niêm yết
  /giá bán tại/gi,                       // giá bán tại nông trại, tại kho
  /vị thế (mua|bán) ròng/gi,             // dữ liệu vị thế của quỹ đầu cơ
  /vị thế bán khống/gi,
  /(những )?(người|nhà đầu tư) mua ở/gi, // "những người mua ở vùng đỉnh chịu lỗ"
  /đang chốt lời/gi,                     // thuật lại hành vi đã xảy ra
  /chốt lời sau/gi,
  /Trước khi hành động, hãy hiểu rõ/gi,  // câu nhắc thận trọng, không phải xúi giao dịch
];

function boCumMoTa(text) {
  let ketQua = String(text || "");
  for (const cum of MO_TA_THI_TRUONG) ketQua = ketQua.replace(cum, " ");
  return ketQua;
}

function scan(re, text) {
  const hits = [];
  for (const line of String(text || "").split("\n")) {
    const m = line.match(re);
    if (m) hits.push(m[0].trim());
  }
  return [...new Set(hits)];
}

// Quy ước dự án: số liệu KHÔNG bị cấm — số liệu KHÔNG GHI NGUỒN mới bị cấm.
// Nên khi bắt được con số xác suất, còn phải xem quanh đó có nêu nguồn hay không.
const NGUON_RE = /CME|FedWatch|Reuters|Bloomberg|USDA|IEA|OPEC|LME|MXV|Ngân hàng Nhà nước|Tổng cục|theo (công cụ|khảo sát|báo cáo|số liệu|dữ liệu)|thị trường (đang )?định giá|thị trường hợp đồng tương lai/i;

// Trả về những con số KHÔNG có nguồn kèm theo. Xét cả dòng chứa số lẫn dòng ngay
// trước nó, vì nguồn hay được nêu ở câu dẫn rồi mới liệt kê số bên dưới.
function soThieuNguon(re, text) {
  const dong = String(text || "").split("\n");
  const hits = [];
  for (let i = 0; i < dong.length; i++) {
    const m = dong[i].match(re);
    if (!m) continue;
    const quanhDo = [dong[i - 2], dong[i - 1], dong[i]].filter(Boolean).join(" ");
    if (NGUON_RE.test(quanhDo)) continue; // có nguồn → hợp lệ, không báo
    hits.push(m[0].trim());
  }
  return [...new Set(hits)];
}

const files = (await readdir(DIR)).filter((f) => f.endsWith(".md"));
let problems = 0;

for (const f of files) {
  const raw = await readFile(join(DIR, f), "utf8");
  // Quét cả phần khai báo đầu bài lẫn nội dung — vì phần tóm tắt (summary) cũng
  // hiện ra cho người đọc trên Google, lời khuyên nằm ở đó cũng nguy hiểm như trong bài.
  const body = boCumMoTa(raw);
  const issues = [];
  const fb = scan(FORBIDDEN_RE, body);
  if (fb.length) issues.push(`🚨 KHUYẾN NGHỊ giao dịch: ${fb.join(", ")}`);
  const fp = soThieuNguon(FAKE_PRECISION_RE, body);
  if (fp.length) issues.push(`⚠️  SỐ xác suất KHÔNG GHI NGUỒN: ${fp.join(", ")}`);
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
