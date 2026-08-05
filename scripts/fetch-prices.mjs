// ============================================================
// Bot lấy GIÁ hàng hóa về máy chủ mình, ghi vào public/data/gia.json.
//
// Vì sao cần: trước đây giá chỉ hiện trong khung nhúng TradingView, nên
//   - Google không đọc được giá → không lên được từ khoá "giá cà phê hôm nay"
//   - khách phải bấm từng mặt hàng mới thấy giá
//   - không có dữ liệu lịch sử để tính thay đổi tuần/tháng/năm
// Có tập tin gia.json rồi thì bảng giá hiện số ngay trong trang.
//
// Nguồn: Yahoo Finance (miễn phí, không cần khoá). Lấy được 18/25 mặt hàng.
// Bảy mặt hàng còn lại (cà phê Robusta, cao su, quặng sắt, kẽm, chì, niken,
// thiếc) giao dịch ở LME / ICE châu Âu / Thượng Hải — dữ liệu có bản quyền,
// chưa có nguồn miễn phí nào đủ tin cậy.
//
// Bot còn lấy TỶ GIÁ USD/VND (mã USDVND=X) để trang web quy giá thế giới ra
// tiền Việt. Không lấy được tỷ giá thì tập tin ghi `tyGia: null`, các trang tự
// ẩn phần quy đổi — thà thiếu cột tiền Việt còn hơn quy đổi bằng số đoán bừa.
//
// Cách chạy:
//   npm run gia            → lấy giá thật, ghi đè public/data/gia.json
//   npm run gia -- --thu   → chỉ in ra màn hình, KHÔNG ghi tập tin
// ============================================================
import { writeFile, readFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ALL } from "../src/data/commodities.mjs";
import { kyHanHopDong } from "../src/data/quy-doi.mjs";

const GOC = join(dirname(fileURLToPath(import.meta.url)), "..");
const TAP_TIN = join(GOC, "public", "data", "gia.json");
const chiThu = process.argv.includes("--thu");

// Giá hàng hoá hiếm khi đổi quá 25% trong một phiên. Vượt ngưỡng này thì
// nhiều khả năng dữ liệu lỗi (hợp đồng hết hạn, đổi kỳ hạn) → không đăng.
const NGUONG_BAT_THUONG = 25;

// Tỷ giá USD/VND — dùng để quy giá thế giới ra tiền Việt.
// Khoảng hợp lý đặt rất rộng để không phải sửa mỗi năm, nhưng vẫn đủ chặn
// trường hợp Yahoo trả nhầm mã (ví dụ trả về tỷ giá đồng khác, hay trả số 1).
const TY_GIA_THAP_NHAT = 15000;
const TY_GIA_CAO_NHAT = 60000;
// Đồng Việt Nam do Ngân hàng Nhà nước neo biên độ, một ngày không thể nhảy
// quá vài phần trăm. Vượt 5% so với phiên trước là dấu hiệu dữ liệu lỗi.
const NGUONG_TY_GIA_BAT_THUONG = 5;
// Tỷ giá nhích một vài đồng thì coi như không đổi — tránh việc thị trường
// hàng hoá đã đóng cửa mà vẫn ghi lại tập tin, sinh lượt lưu phiên bản thừa.
const NGUONG_TY_GIA_COI_NHU_KHONG_DOI = 0.05;

// ── Giá GIAO NGAY cho ba kim loại quý ─────────────────────────────────────
//
// Vì sao cần: Yahoo chỉ có giá HỢP ĐỒNG TƯƠNG LAI. Với vàng thì mã GC=F trả về
// hợp đồng tháng 12 (hợp đồng giao dịch nhiều nhất) — giá cao hơn giá giao ngay
// khoảng 1,5% vì còn cộng chi phí lưu kho và lãi suất cho 4 tháng tới hạn.
// Trong khi đó ai tra "giá vàng thế giới" cũng ra giá GIAO NGAY. Chênh 1,5%
// quy ra tiền Việt là gần 2 triệu đồng một lượng — đủ để khách mất lòng tin.
//
// Chỉ làm với ba kim loại quý. Dầu, ngô, cà phê... thì thị trường và báo chí
// đều lấy hợp đồng tương lai làm chuẩn, không cần giá giao ngay.
const MA_GIAO_NGAY = { vang: "XAU", bac: "XAG", "bach-kim": "XPT" };
// Giá giao ngay và giá hợp đồng tương lai luôn bám nhau. Lệch quá 15% nghĩa là
// một trong hai nguồn hỏng → bỏ số giao ngay, giữ nguyên số hợp đồng.
const NGUONG_LECH_GIAO_NGAY = 15;

const MAY_TRINH_DUYET = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";

function lamTron(so, chuSo = 2) {
  if (so === null || so === undefined || Number.isNaN(so)) return null;
  return Math.round(so * 10 ** chuSo) / 10 ** chuSo;
}

// Lấy một mặt hàng: giá hiện tại + lịch sử 1 năm để tính các mốc thay đổi
async function layMotMatHang(maYahoo) {
  const url =
    "https://query1.finance.yahoo.com/v8/finance/chart/" +
    encodeURIComponent(maYahoo) +
    "?interval=1d&range=1y";
  const phanHoi = await fetch(url, { headers: { "User-Agent": MAY_TRINH_DUYET } });
  if (!phanHoi.ok) throw new Error("máy chủ trả về HTTP " + phanHoi.status);

  const duLieu = await phanHoi.json();
  const ketQua = duLieu?.chart?.result?.[0];
  if (!ketQua?.meta?.regularMarketPrice) throw new Error("không có giá trong dữ liệu trả về");

  const thongTin = ketQua.meta;
  const moc = ketQua.timestamp || [];
  const giaDong = ketQua.indicators?.quote?.[0]?.close || [];
  const khoiLuongNgay = ketQua.indicators?.quote?.[0]?.volume || [];

  // Ghép ngày với giá, bỏ những phiên thiếu dữ liệu
  const lichSu = [];
  for (let i = 0; i < moc.length; i++) {
    if (giaDong[i] === null || giaDong[i] === undefined) continue;
    lichSu.push({
      ngay: new Date(moc[i] * 1000).toISOString().slice(0, 10),
      gia: giaDong[i],
      khoiLuong: khoiLuongNgay[i] ?? 0,
    });
  }
  if (lichSu.length < 2) throw new Error("lịch sử giá quá ngắn, không tính được thay đổi");

  const giaHienTai = thongTin.regularMarketPrice;
  const ngayHomNay = new Date(thongTin.regularMarketTime * 1000).toISOString().slice(0, 10);

  // ⚠️ KHÔNG dùng chartPreviousClose — đó là giá đóng cửa TRƯỚC CẢ KHOẢNG
  // thời gian yêu cầu (ở đây là 1 năm trước), không phải phiên liền trước.
  // Đã từng suýt hiển thị dầu WTI giảm 11% trong khi thực tế chỉ giảm 0,73%.
  const cacPhienTruoc = lichSu.filter((p) => p.ngay < ngayHomNay);
  const dongCuaPhienTruoc = cacPhienTruoc.length
    ? cacPhienTruoc[cacPhienTruoc.length - 1].gia
    : lichSu[lichSu.length - 2].gia;

  // Tìm giá gần nhất cách đây n ngày, để tính thay đổi tuần/tháng/năm
  function giaCachDay(soNgay) {
    const gioiHan = new Date(Date.now() - soNgay * 86400000).toISOString().slice(0, 10);
    const truoc = lichSu.filter((p) => p.ngay <= gioiHan);
    return truoc.length ? truoc[truoc.length - 1].gia : null;
  }
  const phanTramSoVoi = (giaCu) =>
    giaCu ? lamTron(((giaHienTai - giaCu) / giaCu) * 100) : null;

  const doiTuyetDoi = giaHienTai - dongCuaPhienTruoc;
  const doiPhanTram = (doiTuyetDoi / dongCuaPhienTruoc) * 100;

  return {
    gia: lamTron(giaHienTai, 4),
    dongCuaTruoc: lamTron(dongCuaPhienTruoc, 4),
    doi: lamTron(doiTuyetDoi, 4),
    doiPhanTram: lamTron(doiPhanTram),
    caoTrongNgay: lamTron(thongTin.regularMarketDayHigh, 4),
    thapTrongNgay: lamTron(thongTin.regularMarketDayLow, 4),
    cao52Tuan: lamTron(thongTin.fiftyTwoWeekHigh, 4),
    thap52Tuan: lamTron(thongTin.fiftyTwoWeekLow, 4),
    doiMotTuan: phanTramSoVoi(giaCachDay(7)),
    doiMotThang: phanTramSoVoi(giaCachDay(30)),
    doiMotNam: phanTramSoVoi(giaCachDay(365)),
    // Tổng khối lượng 30 phiên gần nhất. Không xét riêng phiên hiện tại vì
    // vài sàn (ICE) báo khối lượng trễ, phiên đang chạy hay hiện số 0.
    khoiLuong30Phien: lichSu.slice(-30).reduce((tong, p) => tong + (p.khoiLuong || 0), 0),
    tienTe: thongTin.currency || "",
    tenHopDong: thongTin.shortName || "",
    // Hợp đồng tương lai tháng nào — ghi sẵn ở đây để cả ba trang web dùng
    // chung, khỏi phải đọc lại tên hợp đồng ở từng nơi
    kyHan: kyHanHopDong(thongTin.shortName || ""),
    san: thongTin.fullExchangeName || thongTin.exchangeName || "",
    capNhat: new Date(thongTin.regularMarketTime * 1000).toISOString(),
    // 30 phiên gần nhất — đủ vẽ biểu đồ tí hon trong bảng giá
    duongGia: lichSu.slice(-30).map((p) => lamTron(p.gia, 4)),
  };
}

// Lấy tỷ giá 1 USD bằng bao nhiêu đồng.
// Đây là tỷ giá thị trường quốc tế, KHÔNG phải giá niêm yết mua/bán tại quầy
// ngân hàng ở Việt Nam — ngân hàng bán ra bao giờ cũng cao hơn một chút.
async function layTyGia() {
  const url =
    "https://query1.finance.yahoo.com/v8/finance/chart/USDVND%3DX?interval=1d&range=1mo";
  const phanHoi = await fetch(url, { headers: { "User-Agent": MAY_TRINH_DUYET } });
  if (!phanHoi.ok) throw new Error("máy chủ trả về HTTP " + phanHoi.status);

  const ketQua = (await phanHoi.json())?.chart?.result?.[0];
  const giaHienTai = ketQua?.meta?.regularMarketPrice;
  if (!giaHienTai) throw new Error("không có tỷ giá trong dữ liệu trả về");

  // Yahoo phải trả đúng cặp USD → VND, không phải đồng tiền nào khác
  if (ketQua.meta.currency !== "VND") {
    throw new Error("Yahoo trả về đồng " + ketQua.meta.currency + ", không phải VND");
  }
  if (giaHienTai < TY_GIA_THAP_NHAT || giaHienTai > TY_GIA_CAO_NHAT) {
    throw new Error("tỷ giá " + giaHienTai + " nằm ngoài khoảng hợp lý — nghi dữ liệu lỗi");
  }

  // So với phiên liền trước xem có nhảy bất thường không
  const chuoi = (ketQua.indicators?.quote?.[0]?.close || []).filter((x) => x != null);
  const phienTruoc = chuoi.length >= 2 ? chuoi[chuoi.length - 2] : null;
  if (phienTruoc) {
    const doiPhanTram = Math.abs(((giaHienTai - phienTruoc) / phienTruoc) * 100);
    if (doiPhanTram > NGUONG_TY_GIA_BAT_THUONG) {
      throw new Error(
        "tỷ giá đổi " + lamTron(doiPhanTram) + "% so với phiên trước — nghi dữ liệu lỗi"
      );
    }
  }

  return {
    gia: Math.round(giaHienTai),
    nguon: "Yahoo Finance (USD/VND)",
    capNhat: new Date(ketQua.meta.regularMarketTime * 1000).toISOString(),
  };
}

// Lấy giá giao ngay một kim loại quý (XAU vàng, XAG bạc, XPT bạch kim).
// Nguồn này chỉ cho giá hiện tại, KHÔNG có lịch sử — nên nó chỉ là số bổ sung,
// mọi thứ cần chuỗi lịch sử (biến động tuần/tháng/năm, đường giá 30 phiên) vẫn
// lấy từ hợp đồng tương lai của Yahoo.
async function layGiaGiaoNgay(maKimLoai, giaHopDong) {
  const phanHoi = await fetch("https://api.gold-api.com/price/" + maKimLoai, {
    headers: { "User-Agent": MAY_TRINH_DUYET },
    signal: AbortSignal.timeout(12000),
  });
  if (!phanHoi.ok) throw new Error("máy chủ trả về HTTP " + phanHoi.status);

  const duLieu = await phanHoi.json();
  const gia = duLieu?.price;
  if (!(gia > 0)) throw new Error("không có giá trong dữ liệu trả về");
  if (duLieu.currency !== "USD") {
    throw new Error("trả về đồng " + duLieu.currency + ", không phải USD");
  }

  // Đối chiếu với giá hợp đồng tương lai — hai số phải bám nhau
  const lech = Math.abs(((gia - giaHopDong) / giaHopDong) * 100);
  if (lech > NGUONG_LECH_GIAO_NGAY) {
    throw new Error(
      "lệch " + lamTron(lech) + "% so với giá hợp đồng tương lai — nghi dữ liệu lỗi"
    );
  }

  return {
    gia: lamTron(gia, 4),
    lechSoVoiHopDong: lamTron(((giaHopDong - gia) / gia) * 100),
    nguon: "gold-api.com",
    capNhat: duLieu.updatedAt || new Date().toISOString(),
  };
}

// ==== Chạy chính ====
const canLay = ALL.filter((mh) => mh.yahoo);
console.log("Lấy giá " + canLay.length + "/" + ALL.length + " mặt hàng có nguồn số...\n");

// Đọc bản cũ để dùng lại khi một mã lỗi — thà hiện giá cũ có ghi rõ thời điểm
// còn hơn để trống hoặc hiện số sai.
let banCu = { items: {} };
if (existsSync(TAP_TIN)) {
  try {
    banCu = JSON.parse(await readFile(TAP_TIN, "utf8"));
  } catch {
    console.log("⚠️  Không đọc được bản cũ, bỏ qua.");
  }
}

const ketQua = {};
let soDuoc = 0;
let soLoi = 0;
let soDungBanCu = 0;

for (const matHang of canLay) {
  try {
    const gia = await layMotMatHang(matHang.yahoo);

    // Kiểm tra tính hợp lý trước khi nhận
    if (!(gia.gia > 0)) throw new Error("giá không hợp lệ: " + gia.gia);
    if (Math.abs(gia.doiPhanTram) > NGUONG_BAT_THUONG) {
      throw new Error(
        "thay đổi " + gia.doiPhanTram + "% vượt ngưỡng bất thường — nghi dữ liệu lỗi"
      );
    }
    // Hợp đồng suốt 30 phiên không ai giao dịch thì giá niêm yết không đáng tin.
    // Đã gặp mã quặng sắt TIO=F: khối lượng bằng 0 suốt, giá báo 161,91 trong
    // khi chuỗi lịch sử chỉ quanh 93,7 — chênh 73%.
    if (gia.khoiLuong30Phien === 0) {
      throw new Error("suốt 30 phiên không có giao dịch nào — giá không đáng tin");
    }
    // Giá hiện tại lệch quá xa phiên gần nhất trong chuỗi lịch sử → dữ liệu vênh
    const giaCuoiChuoi = gia.duongGia[gia.duongGia.length - 1];
    if (giaCuoiChuoi && Math.abs((gia.gia - giaCuoiChuoi) / giaCuoiChuoi) > 0.3) {
      throw new Error("giá hiện tại lệch quá xa chuỗi lịch sử — dữ liệu không khớp");
    }

    ketQua[matHang.slug] = gia;
    soDuoc++;
    const dau = gia.doi >= 0 ? "+" : "";
    console.log(
      "  ✅ " + matHang.name.padEnd(16) +
      String(gia.gia).padStart(10) + " " + gia.tienTe.padEnd(4) +
      (dau + gia.doiPhanTram + "%").padStart(9) + "   " + gia.tenHopDong
    );
  } catch (loi) {
    soLoi++;
    console.log("  ❌ " + matHang.name.padEnd(16) + matHang.yahoo.padEnd(8) + loi.message);
    // Giữ lại số cũ nếu có, đánh dấu là số cũ
    const cu = banCu.items?.[matHang.slug];
    if (cu) {
      ketQua[matHang.slug] = { ...cu, soCu: true };
      soDungBanCu++;
      console.log("     ↳ giữ lại giá lần lấy trước (" + (cu.capNhat || "không rõ lúc nào") + ")");
    }
  }
}

console.log(
  "\nLấy được " + soDuoc + ", lỗi " + soLoi +
  (soDungBanCu ? " (trong đó " + soDungBanCu + " mã dùng lại giá cũ)" : "")
);

// ==== Giá giao ngay cho ba kim loại quý ====
for (const [slug, maKimLoai] of Object.entries(MA_GIAO_NGAY)) {
  const matHang = ketQua[slug];
  // Không lấy được giá hợp đồng thì bỏ qua luôn — không có gì để đối chiếu
  if (!matHang?.gia) continue;
  try {
    matHang.giaoNgay = await layGiaGiaoNgay(maKimLoai, matHang.gia);
    const ten = ALL.find((mh) => mh.slug === slug)?.name || slug;
    const lech = matHang.giaoNgay.lechSoVoiHopDong;
    console.log(
      "  🥇 " + ten.padEnd(16) +
      "giao ngay " + String(matHang.giaoNgay.gia).padStart(9) + " USD" +
      "   (hợp đồng " + matHang.tenHopDong + " " +
      (lech >= 0 ? "cao hơn " : "thấp hơn ") + Math.abs(lech) + "%)"
    );
  } catch (loi) {
    console.log("  🥇 ❌ " + slug.padEnd(14) + "không lấy được giá giao ngay: " + loi.message);
    // Giữ lại số giao ngay lần trước nếu có — vẫn hơn là mất hẳn
    const cu = banCu.items?.[slug]?.giaoNgay;
    if (cu) {
      matHang.giaoNgay = { ...cu, soCu: true };
      console.log("     ↳ giữ lại giá giao ngay lần trước (" + (cu.capNhat || "không rõ lúc nào") + ")");
    }
  }
}

// ==== Tỷ giá USD/VND ====
// Không có tỷ giá thì trang web chỉ hiện giá USD, KHÔNG hiện phần quy đổi.
// Thà thiếu cột tiền Việt còn hơn quy đổi bằng một tỷ giá đoán bừa.
let tyGia = null;
try {
  tyGia = await layTyGia();
  console.log(
    "\n💱 Tỷ giá: 1 USD = " + tyGia.gia.toLocaleString("vi-VN") + " đồng  (" + tyGia.capNhat + ")"
  );
} catch (loi) {
  console.log("\n💱 ❌ Không lấy được tỷ giá USD/VND: " + loi.message);
  if (banCu.tyGia?.gia) {
    tyGia = { ...banCu.tyGia, soCu: true };
    console.log(
      "     ↳ giữ lại tỷ giá lần lấy trước: " +
      tyGia.gia.toLocaleString("vi-VN") + " đồng (" + (tyGia.capNhat || "không rõ lúc nào") + ")"
    );
  } else {
    console.log("     ↳ chưa có tỷ giá cũ để dùng lại — trang web sẽ tạm ẩn phần quy đổi tiền Việt");
  }
}

if (chiThu) {
  console.log("\n== Chế độ xem thử — KHÔNG ghi tập tin ==");
  process.exit(0);
}

// Không lấy được mã nào thì đừng ghi đè — giữ nguyên bản cũ còn hơn xoá sạch
if (soDuoc === 0) {
  console.error("\n❌ Không lấy được mã nào. Giữ nguyên tập tin cũ, không ghi đè.");
  process.exit(1);
}

// Thị trường đóng cửa (đêm, cuối tuần, ngày lễ) thì giá y hệt lần trước. Ghi lại
// chỉ tổ tạo một lượt lưu phiên bản rỗng nghĩa. Giống hệt thì thôi, không ghi.
const giaGiongHet = JSON.stringify(banCu.items || {}) === JSON.stringify(ketQua);
// Tỷ giá nhích vài đồng cũng coi như không đổi — nếu xét chặt từng đồng thì
// giá hàng hoá đứng yên mà vẫn bị ghi lại, sinh lượt lưu phiên bản thừa.
const tyGiaCu = banCu.tyGia?.gia || null;
const tyGiaGiongHet =
  (!tyGia && !tyGiaCu) ||
  (tyGia && tyGiaCu &&
    Math.abs(((tyGia.gia - tyGiaCu) / tyGiaCu) * 100) <= NGUONG_TY_GIA_COI_NHU_KHONG_DOI);

if (giaGiongHet && tyGiaGiongHet) {
  console.log("\nGiá và tỷ giá không đổi so với lần lấy trước (thị trường có thể đang đóng cửa).");
  console.log("Không ghi lại tập tin — tránh tạo lượt lưu phiên bản thừa.");
  process.exit(0);
}

await mkdir(dirname(TAP_TIN), { recursive: true });
await writeFile(
  TAP_TIN,
  JSON.stringify(
    {
      capNhat: new Date().toISOString(),
      nguon: "Yahoo Finance",
      soMatHang: Object.keys(ketQua).length,
      // Thiếu tỷ giá thì để null — trang web tự ẩn phần quy đổi tiền Việt
      tyGia: tyGia || null,
      items: ketQua,
    },
    null,
    1
  ),
  "utf8"
);

console.log("✅ Đã ghi " + TAP_TIN);
