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

// ── Ngưỡng CẢNH BÁO — bot hỏng thì phải KÊU ───────────────────────────────
//
// 🔴 Bẫy đã mắc ở bot tin tức (22–27/08/2026): khâu dịch chết mà không kêu một
// tiếng, web đầy tin tiếng Anh suốt 5 ngày. Bot giá có đúng điểm yếu ấy: trước
// đây chỉ khi KHÔNG lấy được mã nào mới báo đỏ — lấy được 1/18 mã vẫn xanh như
// thường, và giá cũ dùng lại có thể ôi nhiều ngày mà không ai hay.
//
// Ngưỡng cố ý đặt vừa phải: cảnh báo kêu oan nhiều lần thì người vận hành sẽ
// quen tay bỏ qua, đến lúc hỏng thật lại không ai nhìn.

// Lỗi lẻ tẻ 1–2 mã là chuyện thường (mạng chập chờn, Yahoo nghẽn nhất thời).
// Từ một phần ba số mã trở lên là dấu hiệu nguồn đổi cách trả dữ liệu hoặc chặn bot.
const TY_LE_LOI_BAO_DO = 1 / 3;

// Giá cũ quá 72 giờ thì không còn là "giá hôm nay" nữa. Chọn 72 chứ không nhỏ
// hơn vì kỳ nghỉ cuối tuần bình thường đã cách nhau khoảng 57 giờ (sàn đóng
// 21:00 UTC thứ Sáu, mở lại 22:00 UTC Chủ nhật) — đặt thấp hơn sẽ kêu oan mỗi
// sáng thứ Hai. Dịp lễ dài của sàn Mỹ vẫn có thể kêu oan, chấp nhận đánh đổi.
const SO_GIO_GIA_COI_LA_OI = 72;

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
// Ghi lại TÊN mặt hàng lỗi và mặt hàng phải dùng lại giá cũ, chứ không chỉ đếm
// rồi quên — cuối lượt chạy còn có cái mà báo cho người vận hành biết hỏng ở đâu.
const dsLoi = [];         // { ten, ma, loi }
const dsDungBanCu = [];   // { ten, capNhat }

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
    dsLoi.push({ ten: matHang.name, ma: matHang.yahoo, loi: loi.message });
    console.log("  ❌ " + matHang.name.padEnd(16) + matHang.yahoo.padEnd(8) + loi.message);
    // Giữ lại số cũ nếu có, đánh dấu là số cũ
    const cu = banCu.items?.[matHang.slug];
    if (cu) {
      ketQua[matHang.slug] = { ...cu, soCu: true };
      dsDungBanCu.push({ ten: matHang.name, capNhat: cu.capNhat || null });
      console.log("     ↳ giữ lại giá lần lấy trước (" + (cu.capNhat || "không rõ lúc nào") + ")");
    }
  }
}

console.log(
  "\nLấy được " + soDuoc + ", lỗi " + dsLoi.length +
  (dsDungBanCu.length ? " (trong đó " + dsDungBanCu.length + " mã dùng lại giá cũ)" : "")
);

// ==== Giá giao ngay cho ba kim loại quý ====
// Với vàng, bạc, bạch kim thì đây mới là con số CHÍNH hiện trên web, nên hỏng ở
// đây cũng phải đếm và báo như hỏng giá thường.
const dsGiaoNgayCu = [];   // { ten, capNhat }
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
      dsGiaoNgayCu.push({ ten: ALL.find((mh) => mh.slug === slug)?.name || slug, capNhat: cu.capNhat || null });
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

// ==== SỨC KHOẺ LƯỢT CHẠY — hỏng thì phải KÊU ====
//
// Đặt `process.exitCode` chứ KHÔNG gọi `process.exit()`: phần ghi tập tin bên
// dưới vẫn phải chạy cho xong. Số nào lấy được vẫn là số đúng và mới, đăng lên
// vẫn hơn giữ số hôm qua — nhưng lượt chạy phải đỏ để người vận hành biết đường
// mà sửa. Việc "vẫn commit rồi mới báo đỏ" do workflow lo (fetch-prices.yml).
function soGioKeTu(mocThoiGian) {
  const moc = Date.parse(mocThoiGian || "");
  if (Number.isNaN(moc)) return null;
  return (Date.now() - moc) / 3600000;
}
// Không đọc được mốc thời gian thì coi như ôi — thà kêu oan còn hơn bỏ sót.
const daOi = (mocThoiGian) => {
  const gio = soGioKeTu(mocThoiGian);
  return gio === null || gio > SO_GIO_GIA_COI_LA_OI;
};
const soNgay = (mocThoiGian) => {
  const gio = soGioKeTu(mocThoiGian);
  return gio === null ? "không rõ" : Math.round(gio) + " giờ";
};

// Liệt kê tên nhưng cắt bớt khi quá dài — 18 dòng giống hệt nhau thì người đọc
// bỏ qua cả cảnh báo, thành ra lại không ai biết bot hỏng.
const kePhepTen = (ds, soToiDa = 4) => {
  const ten = ds.map((m) => m.ten);
  return ten.length > soToiDa
    ? ten.slice(0, soToiDa).join(", ") + " …và " + (ten.length - soToiDa) + " mã nữa"
    : ten.join(", ");
};

const canhBaoDo = [];   // đủ nặng để lượt chạy phải đỏ
const canhBaoVang = []; // đáng để mắt, chưa tới mức báo động

// 1. Quá nhiều mã lỗi → nguồn dữ liệu có thể đã đổi hoặc chặn bot.
//    Gom theo thông điệp lỗi: 18 mã cùng chết vì một nguyên nhân thì chỉ cần
//    thấy một dòng là biết nguyên nhân ấy.
if (dsLoi.length >= Math.ceil(canLay.length * TY_LE_LOI_BAO_DO)) {
  const theoLoi = new Map();
  for (const m of dsLoi) {
    if (!theoLoi.has(m.loi)) theoLoi.set(m.loi, []);
    theoLoi.get(m.loi).push(m);
  }
  canhBaoDo.push(
    dsLoi.length + "/" + canLay.length + " mặt hàng KHÔNG lấy được giá — " +
    [...theoLoi].map(([loi, ds]) => '"' + loi + '" (' + kePhepTen(ds) + ")").join(" · ")
  );
} else if (dsLoi.length > 0) {
  canhBaoVang.push(dsLoi.length + " mặt hàng lỗi: " + kePhepTen(dsLoi, 6));
}

// 2. Giá cũ dùng lại đã quá hạn — web đang hiện số không còn đúng ngày hôm nay
const giaOi = dsDungBanCu.filter((m) => daOi(m.capNhat));
if (giaOi.length) {
  canhBaoDo.push(
    giaOi.length + " mặt hàng đang hiện GIÁ CŨ quá " + SO_GIO_GIA_COI_LA_OI + " giờ (cũ nhất " +
    soNgay(giaOi.map((m) => m.capNhat).sort()[0]) + " trước): " + kePhepTen(giaOi)
  );
} else if (dsDungBanCu.length) {
  canhBaoVang.push(dsDungBanCu.length + " mặt hàng dùng lại giá lần trước (còn trong hạn)");
}

// 3. Giá giao ngay kim loại quý — đây mới là số CHÍNH hiện cho vàng/bạc/bạch kim
const giaoNgayOi = dsGiaoNgayCu.filter((m) => daOi(m.capNhat));
if (giaoNgayOi.length) {
  canhBaoDo.push(
    "giá GIAO NGAY quá " + SO_GIO_GIA_COI_LA_OI + " giờ ở: " +
    giaoNgayOi.map((m) => m.ten + " (" + soNgay(m.capNhat) + " trước)").join(" · ")
  );
} else if (dsGiaoNgayCu.length) {
  canhBaoVang.push(dsGiaoNgayCu.length + " kim loại quý dùng lại giá giao ngay lần trước");
}

// 4. Tỷ giá — sai tỷ giá là sai TOÀN BỘ cột quy ra tiền Việt
if (!tyGia) {
  canhBaoDo.push("KHÔNG có tỷ giá USD/VND — mọi trang đang ẩn phần quy đổi tiền Việt");
} else if (tyGia.soCu && daOi(tyGia.capNhat)) {
  canhBaoDo.push("tỷ giá USD/VND đã cũ " + soNgay(tyGia.capNhat) + " — cột tiền Việt đang tính bằng số lỗi thời");
} else if (tyGia.soCu) {
  canhBaoVang.push("tỷ giá dùng lại lần trước (còn trong hạn)");
}

console.log(
  "\n── Sức khoẻ lượt chạy ──────────────────────────────────\n" +
  "   Lấy được " + soDuoc + "/" + canLay.length +
  " · lỗi " + dsLoi.length +
  " · dùng giá cũ " + dsDungBanCu.length +
  " · tỷ giá " + (tyGia ? (tyGia.soCu ? "dùng lại số cũ" : "mới") : "KHÔNG CÓ")
);
for (const c of canhBaoVang) console.log("   ⚠️  " + c);

if (canhBaoDo.length) {
  console.error("\n❌ BOT GIÁ ĐANG HỎNG — không để nó im lặng:");
  for (const c of canhBaoDo) console.error("   • " + c);
  console.error(
    "   Web vẫn hiện số (mới lấy được hoặc số cũ có ghi rõ thời điểm), nhưng phải\n" +
    "   sửa sớm: số cũ để lâu là nói dối người đọc mà không ai biết."
  );
  process.exitCode = 1;
}

if (chiThu) {
  console.log("\n== Chế độ xem thử — KHÔNG ghi tập tin ==");
  process.exit(process.exitCode || 0);
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
  // Không ghi tập tin, nhưng nếu bot đang hỏng thì vẫn phải kêu
  process.exit(process.exitCode || 0);
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
      // Tình hình lượt lấy này, ghi lại để mở tập tin ra là biết ngay bot có
      // đang khoẻ không — khỏi phải lục nhật ký GitHub Actions
      sucKhoe: {
        soCanLay: canLay.length,
        soLayDuoc: soDuoc,
        maLoi: dsLoi.map((m) => m.ten),
        maDungGiaCu: dsDungBanCu.map((m) => m.ten),
        canhBao: canhBaoDo,
      },
      items: ketQua,
    },
    null,
    1
  ),
  "utf8"
);

console.log("✅ Đã ghi " + TAP_TIN);

// Ghi xong rồi mới thoát với mã lỗi — để workflow kịp lưu phiên bản tập tin giá
// trước khi lượt chạy chuyển sang màu đỏ.
if (process.exitCode) {
  console.error("\n⚠️  Đã ghi tập tin, nhưng lượt chạy này BÁO ĐỎ vì các cảnh báo ở trên.");
}
