// ============================================================
// Quy đổi giá hàng hoá thế giới sang ĐƠN VỊ và TIỀN Việt Nam.
//
// Vì sao cần: giá trên sàn quốc tế yết bằng những đơn vị người Việt không
// hình dung được — cents/giạ, USD/pound, USD/ounce troy, USD/thùng. Nhìn
// "459,5 cents/giạ" thì không biết ngô đắt hay rẻ. Nhìn "4.748 đồng/kg" thì
// biết ngay.
//
// ⚠️ ĐIỀU QUAN TRỌNG NHẤT PHẢI HIỂU TRƯỚC KHI DÙNG TẬP TIN NÀY
//
// Con số quy đổi ở đây là QUY ĐỔI THÔ, chỉ gồm đúng ba phép tính:
//     giá sàn  ×  tỷ giá USD/VND  ÷  hệ số đổi đơn vị
//
// Nó KHÔNG PHẢI giá mua bán tại Việt Nam. Chưa cộng: thuế nhập khẩu, thuế
// tiêu thụ đặc biệt, thuế bảo vệ môi trường, thuế giá trị gia tăng, cước tàu,
// bảo hiểm, phí bốc dỡ, chi phí chế biến, lãi của khâu phân phối. Cũng chưa
// tính chênh lệch chất lượng và chủng loại (ví dụ sàn New York yết cà phê
// Arabica, còn Tây Nguyên trồng Robusta — hai thứ khác nhau).
//
// Mỗi mặt hàng vì thế đều có trường `luuY` — câu cảnh báo riêng, BẮT BUỘC
// hiện kèm con số, không được bỏ đi cho gọn.
//
// Cuối tập tin còn hai hàm phục vụ việc trình bày giá cho khỏi gây hiểu nhầm:
// `kyHanHopDong()` đọc ra hợp đồng tháng nào, và `giaHienThi()` chọn giữa giá
// giao ngay với giá hợp đồng tương lai.
// ============================================================

// ── Hằng số đổi đơn vị (theo chuẩn quốc tế, không làm tròn ở đây) ──────────
const KG_MOI_POUND      = 0.45359237;        // 1 pound (cân Anh)
const KG_MOI_OUNCE_TROY = 0.0311034768;      // 1 ounce troy — đơn vị cân kim loại quý
const GAM_MOI_LUONG     = 37.5;              // 1 lượng vàng Việt Nam = 37,5 gam
const LIT_MOI_THUNG     = 158.987294928;     // 1 thùng dầu = 42 gallon Mỹ
const LIT_MOI_GALLON    = 3.785411784;       // 1 gallon Mỹ
const KG_MOI_TAN_NGAN   = 907.18474;         // 1 tấn ngắn (short ton) của Mỹ

// 1 ounce troy bằng bao nhiêu lượng → dùng để đổi giá vàng, bạc, bạch kim
const LUONG_MOI_OUNCE = (KG_MOI_OUNCE_TROY * 1000) / GAM_MOI_LUONG; // ≈ 0,829426
const CHI_MOI_OUNCE   = LUONG_MOI_OUNCE * 10;                        // 1 lượng = 10 chỉ

// Giạ (bushel) nặng bao nhiêu tuỳ loại hạt — đây là quy ước của Bộ Nông nghiệp Mỹ
const KG_MOI_GIA_NGO       = 56 * KG_MOI_POUND; // ngô: 56 pound/giạ ≈ 25,401 kg
const KG_MOI_GIA_DAU_TUONG = 60 * KG_MOI_POUND; // đậu tương: 60 pound/giạ ≈ 27,216 kg
const KG_MOI_GIA_LUA_MI    = 60 * KG_MOI_POUND; // lúa mì: 60 pound/giạ ≈ 27,216 kg

// ── Bảng quy đổi từng mặt hàng ────────────────────────────────────────────
//
// Ý nghĩa các trường:
//   donViGoc  — đơn vị sàn quốc tế đang yết
//   donViVN   — đơn vị người Việt quen dùng, sẽ hiện ra
//   heSo      — 1 đơn vị sàn bằng bao nhiêu đơn vị Việt
//               (giá Việt = giá sàn quy ra đồng ÷ heSo)
//   giaiThich — câu giải thích phép đổi, hiện cho khách tự kiểm lại
//   luuY      — cảnh báo riêng: vì sao số này khác giá mua bán thực tế
//   phu       — đơn vị thứ hai (không bắt buộc), ví dụ vàng còn tính theo chỉ

export const QUY_DOI = {
  // ══ Năng lượng ══
  "dau-tho-wti": {
    donViGoc: "USD/thùng", donViVN: "đồng/lít", heSo: LIT_MOI_THUNG,
    giaiThich: "1 thùng dầu = 42 gallon Mỹ = 158,99 lít",
    luuY: "Đây là giá dầu thô nguyên liệu, chưa qua lọc. Giá xăng dầu bán lẻ ở Việt Nam do liên Bộ Công Thương – Tài chính điều hành, cộng thêm chi phí lọc dầu, thuế nhập khẩu, thuế tiêu thụ đặc biệt, thuế bảo vệ môi trường, thuế giá trị gia tăng, chi phí kinh doanh và quỹ bình ổn — nên luôn cao hơn con số này khá nhiều.",
    phu: { donViVN: "đồng/thùng", heSo: 1 },
  },
  "dau-brent": {
    donViGoc: "USD/thùng", donViVN: "đồng/lít", heSo: LIT_MOI_THUNG,
    giaiThich: "1 thùng dầu = 42 gallon Mỹ = 158,99 lít",
    luuY: "Dầu Brent là dầu thô Biển Bắc, dùng làm giá tham chiếu cho phần lớn dầu nhập khẩu vào châu Á. Vẫn là giá nguyên liệu thô — chưa gồm chi phí lọc, thuế và phí như giá xăng dầu bán lẻ trong nước.",
    phu: { donViVN: "đồng/thùng", heSo: 1 },
  },
  "khi-tu-nhien": {
    donViGoc: "USD/MMBtu", donViVN: "đồng/MMBtu", heSo: 1,
    giaiThich: "MMBtu là một triệu đơn vị nhiệt Anh — đơn vị đo năng lượng, tương đương khoảng 28 mét khối khí thiên nhiên (tuỳ nhiệt trị từng mỏ)",
    luuY: "Đây là giá khí giao tại điểm Henry Hub (bang Louisiana, Mỹ). Giá khí bán tại Việt Nam khác hẳn: khí trong nước theo hợp đồng dài hạn, còn khí hoá lỏng nhập khẩu (LNG) phải cộng chi phí hoá lỏng, vận chuyển bằng tàu chuyên dụng và tái hoá khí.",
  },
  "xang-rbob": {
    donViGoc: "USD/gallon", donViVN: "đồng/lít", heSo: LIT_MOI_GALLON,
    giaiThich: "1 gallon Mỹ = 3,785 lít",
    luuY: "RBOB là xăng thành phẩm giao tại Mỹ, chưa pha thêm ethanol và chưa có thuế. Giá xăng bán lẻ tại Việt Nam do Nhà nước điều hành theo kỳ, gồm giá nhập khẩu cộng thuế nhập khẩu, thuế tiêu thụ đặc biệt, thuế bảo vệ môi trường, thuế giá trị gia tăng, chi phí kinh doanh định mức, lợi nhuận định mức và trích/chi quỹ bình ổn. Đừng lấy con số này so thẳng với giá ở cây xăng.",
  },

  // ══ Nông sản ══
  ngo: {
    donViGoc: "cents/giạ", donViVN: "đồng/kg", heSo: KG_MOI_GIA_NGO,
    giaiThich: "1 giạ ngô = 56 pound = 25,40 kg (quy ước của Bộ Nông nghiệp Mỹ)",
    luuY: "Giá ngô hạt giao tại sàn Chicago. Ngô nhập về Việt Nam làm thức ăn chăn nuôi còn cộng cước tàu biển, bảo hiểm, thuế nhập khẩu, phí bốc dỡ tại cảng và lãi của nhà nhập khẩu — giá về đến nhà máy cao hơn.",
    phu: { donViVN: "đồng/tấn", heSo: KG_MOI_GIA_NGO / 1000 },
  },
  "dau-tuong": {
    donViGoc: "cents/giạ", donViVN: "đồng/kg", heSo: KG_MOI_GIA_DAU_TUONG,
    giaiThich: "1 giạ đậu tương = 60 pound = 27,22 kg",
    luuY: "Giá hạt đậu tương giao tại sàn Chicago, chưa gồm cước vận chuyển về Việt Nam, thuế và phí nhập khẩu.",
    phu: { donViVN: "đồng/tấn", heSo: KG_MOI_GIA_DAU_TUONG / 1000 },
  },
  "kho-dau-tuong": {
    donViGoc: "USD/tấn ngắn", donViVN: "đồng/kg", heSo: KG_MOI_TAN_NGAN,
    giaiThich: "1 tấn ngắn của Mỹ = 907,18 kg (khác tấn 1.000 kg ta hay dùng)",
    luuY: "Khô đậu tương là bã ép dầu, nguyên liệu chính của thức ăn chăn nuôi. Giá về đến nhà máy Việt Nam còn cộng cước tàu, thuế nhập khẩu và phí bốc dỡ.",
    phu: { donViVN: "đồng/tấn", heSo: KG_MOI_TAN_NGAN / 1000 },
  },
  "dau-dau-tuong": {
    donViGoc: "cents/pound", donViVN: "đồng/kg", heSo: KG_MOI_POUND,
    giaiThich: "1 pound = 0,4536 kg",
    luuY: "Đây là dầu đậu tương thô trên sàn, chưa tinh luyện và chưa đóng chai. Dầu ăn bán ở siêu thị còn cộng chi phí tinh luyện, bao bì, phân phối và thuế.",
  },
  "lua-mi": {
    donViGoc: "cents/giạ", donViVN: "đồng/kg", heSo: KG_MOI_GIA_LUA_MI,
    giaiThich: "1 giạ lúa mì = 60 pound = 27,22 kg",
    luuY: "Lúa mì hạt tại sàn Chicago (loại SRW — lúa mì đỏ mềm vụ đông). Bột mì bán tại Việt Nam còn cộng cước nhập khẩu, chi phí xay xát và phân phối.",
    phu: { donViVN: "đồng/tấn", heSo: KG_MOI_GIA_LUA_MI / 1000 },
  },

  // ══ Nguyên liệu công nghiệp ══
  "ca-phe-arabica": {
    donViGoc: "cents/pound", donViVN: "đồng/kg", heSo: KG_MOI_POUND,
    giaiThich: "1 pound = 0,4536 kg",
    luuY: "⚠️ Đây là cà phê ARABICA trên sàn New York. Tây Nguyên chủ yếu trồng ROBUSTA — loại đó yết giá ở sàn London, thường thấp hơn Arabica đáng kể và biến động khác hẳn. KHÔNG dùng con số này để tính giá cà phê nhân xô Đắk Lắk, Gia Lai, Lâm Đồng. Giá thu mua tại vườn còn trừ lùi theo chất lượng, độ ẩm và tỷ lệ hạt đen vỡ.",
  },
  duong: {
    donViGoc: "cents/pound", donViVN: "đồng/kg", heSo: KG_MOI_POUND,
    giaiThich: "1 pound = 0,4536 kg",
    luuY: "Đường thô số 11 giao tại sàn quốc tế, chưa tinh luyện. Đường trắng bán lẻ ở Việt Nam cao hơn nhiều vì còn chi phí tinh luyện, đóng gói, phân phối, thuế nhập khẩu (trong và ngoài hạn ngạch chịu thuế khác nhau) và thuế giá trị gia tăng.",
  },
  cacao: {
    donViGoc: "USD/tấn", donViVN: "đồng/kg", heSo: 1000,
    giaiThich: "1 tấn = 1.000 kg",
    luuY: "Giá hạt cacao khô trên sàn quốc tế. Cacao trồng ở Bến Tre, Đắk Lắk bán theo giá thoả thuận với đơn vị thu mua, thường bám giá sàn nhưng trừ lùi theo chất lượng lên men và độ ẩm.",
    phu: { donViVN: "đồng/tấn", heSo: 1 },
  },
  bong: {
    donViGoc: "cents/pound", donViVN: "đồng/kg", heSo: KG_MOI_POUND,
    giaiThich: "1 pound = 0,4536 kg",
    luuY: "Bông xơ giao tại sàn Mỹ. Việt Nam nhập gần như toàn bộ bông cho ngành dệt may — giá về nhà máy còn cộng cước tàu, bảo hiểm và phí nhập khẩu.",
  },

  // ══ Kim loại ══
  vang: {
    donViGoc: "USD/ounce", donViVN: "đồng/lượng", heSo: LUONG_MOI_OUNCE,
    giaiThich: "1 ounce troy = 31,1035 gam; 1 lượng Việt Nam = 37,5 gam → 1 ounce ≈ 0,8294 lượng",
    luuY: "⚠️ Đây là giá vàng THẾ GIỚI (giá giao ngay) quy đổi, KHÔNG phải giá vàng miếng SJC hay vàng nhẫn bán trong nước. Giá vàng miếng trong nước lâu nay cao hơn giá thế giới quy đổi một khoảng đáng kể, do hạn chế nhập khẩu và độc quyền thương hiệu vàng miếng. Muốn biết giá mua bán thật, phải xem bảng giá của doanh nghiệp kinh doanh vàng tại đúng thời điểm giao dịch. Con số này cũng chưa gồm thuế và chênh lệch mua – bán.",
    phu: { donViVN: "đồng/chỉ", heSo: CHI_MOI_OUNCE },
  },
  bac: {
    donViGoc: "USD/ounce", donViVN: "đồng/lượng", heSo: LUONG_MOI_OUNCE,
    giaiThich: "1 ounce troy = 31,1035 gam; 1 lượng = 37,5 gam → 1 ounce ≈ 0,8294 lượng",
    luuY: "Giá bạc giao trên sàn quốc tế, loại bạc nguyên chất 99,9%. Bạc miếng và bạc trang sức bán trong nước còn cộng chi phí gia công, thương hiệu và chênh lệch mua – bán của cửa hàng.",
    phu: { donViVN: "đồng/kg", heSo: KG_MOI_OUNCE_TROY },
  },
  dong: {
    donViGoc: "USD/pound", donViVN: "đồng/kg", heSo: KG_MOI_POUND,
    giaiThich: "1 pound = 0,4536 kg",
    luuY: "⚠️ Đây là giá đồng trên sàn COMEX (Mỹ). Giá đồng sàn London (LME) — mốc tham chiếu quen thuộc hơn với người mua châu Á — có thể chênh vài phần trăm so với COMEX, tuỳ chính sách thuế và cung cầu từng thị trường. Dây điện, ống đồng, đồng phế liệu tại Việt Nam lại có giá khác nữa, tuỳ độ tinh khiết, chi phí gia công và khâu thu mua.",
    phu: { donViVN: "đồng/tấn", heSo: KG_MOI_POUND / 1000 },
  },
  "bach-kim": {
    donViGoc: "USD/ounce", donViVN: "đồng/lượng", heSo: LUONG_MOI_OUNCE,
    giaiThich: "1 ounce troy = 31,1035 gam; 1 lượng = 37,5 gam → 1 ounce ≈ 0,8294 lượng",
    luuY: "Bạch kim chủ yếu dùng trong công nghiệp (bộ lọc khí thải ô tô, thiết bị y tế) chứ ít mua bán tích trữ như vàng ở Việt Nam. Trang sức bạch kim đắt hơn nhiều vì cộng chi phí chế tác.",
    phu: { donViVN: "đồng/chỉ", heSo: CHI_MOI_OUNCE },
  },
  nhom: {
    donViGoc: "USD/tấn", donViVN: "đồng/kg", heSo: 1000,
    giaiThich: "1 tấn = 1.000 kg",
    luuY: "Giá nhôm thỏi nguyên chất trên sàn. Nhôm định hình, nhôm tấm bán tại Việt Nam cao hơn vì cộng chi phí đùn ép, sơn phủ, cắt theo yêu cầu và vận chuyển.",
    phu: { donViVN: "đồng/tấn", heSo: 1 },
  },
};

// ── Các hàm dùng chung ────────────────────────────────────────────────────

/**
 * Đọc kỳ hạn hợp đồng từ tên Yahoo trả về.
 *
 * Vì sao cần: mọi giá trong bảng đều là giá HỢP ĐỒNG TƯƠNG LAI của một tháng
 * cụ thể, không phải giá giao ngay. Không ghi rõ tháng nào thì khách so với
 * chỗ khác thấy lệch mà không hiểu vì sao.
 *
 * Yahoo trả tên theo nhiều kiểu, có kiểu còn bị cắt cụt:
 *   "Gold Dec 26" · "Corn Futures,Dec-2026" · "Chicago SRW Wheat Futures,Sep-2"
 * Đọc không ra thì trả null — thà không ghi còn hơn ghi sai tháng.
 *
 * @returns {string|null} ví dụ "T12/26", hoặc "T9" khi tên bị cắt mất năm
 */
export function kyHanHopDong(tenHopDong) {
  if (!tenHopDong) return null;
  const THANG = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
  };
  // Bắt buộc phải có số đứng sau tên tháng, để không nhận nhầm những chữ
  // tình cờ bắt đầu giống tên tháng (Marine, Maybank…)
  const khop = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s,\-]+(\d{1,4})\b/i
    .exec(tenHopDong);
  if (!khop) return null;

  const thang = THANG[khop[1].toLowerCase()];
  const namGoc = khop[2];
  // Năm bị cắt còn một chữ số thì bỏ hẳn phần năm, chỉ ghi tháng
  if (namGoc.length < 2) return "T" + thang;
  return "T" + thang + "/" + (namGoc.length === 4 ? namGoc.slice(2) : namGoc);
}

/**
 * Chọn con số nào để hiện ra và để quy đổi.
 *
 * Ba kim loại quý có thêm giá GIAO NGAY — đó mới là con số ai tra "giá vàng
 * thế giới" cũng thấy, nên lấy làm số chính. Các mặt hàng còn lại thì thị
 * trường và báo chí đều lấy hợp đồng tương lai làm chuẩn, giữ nguyên.
 *
 * @param {object} g một mục trong `items` của gia.json
 */
export function giaHienThi(g) {
  if (!g) return null;
  const coGiaoNgay = g.giaoNgay?.gia > 0;
  return {
    gia: coGiaoNgay ? g.giaoNgay.gia : g.gia,
    laGiaoNgay: coGiaoNgay,
    giaHopDong: g.gia,
    // Bot đã ghi sẵn `kyHan`; tự đọc lại từ tên hợp đồng để bản dữ liệu cũ
    // (ghi trước khi có trường này) vẫn hiện đúng
    kyHan: g.kyHan || kyHanHopDong(g.tenHopDong),
    // Hợp đồng tương lai cao hơn giao ngay bao nhiêu phần trăm
    lechHopDong: coGiaoNgay ? g.giaoNgay.lechSoVoiHopDong ?? null : null,
    nguonGiaoNgay: coGiaoNgay ? g.giaoNgay.nguon || "" : "",
  };
}

/**
 * Đổi giá sàn sang tiền Việt theo đơn vị người Việt quen dùng.
 *
 * @param {string} slug   mã mặt hàng, ví dụ "ca-phe-arabica"
 * @param {number} gia    giá sàn lấy từ gia.json
 * @param {string} tienTe đơn vị tiền Yahoo trả về: "USD" hoặc "USX" (cents)
 * @param {number} tyGia  tỷ giá 1 USD bằng bao nhiêu đồng
 * @returns {object|null} null nếu chưa có bảng quy đổi hoặc thiếu dữ liệu
 */
export function quyDoiVND(slug, gia, tienTe, tyGia) {
  const bang = QUY_DOI[slug];
  if (!bang || !(gia > 0) || !(tyGia > 0)) return null;

  // Yahoo yết một số hàng bằng cents (mã tiền tệ "USX"), phải chia 100 trước
  const giaUSD = tienTe === "USX" ? gia / 100 : gia;
  const dongMoiDonViSan = giaUSD * tyGia;

  const ketQua = {
    gia: dongMoiDonViSan / bang.heSo,
    donVi: bang.donViVN,
    donViGoc: bang.donViGoc,
    giaUSD,
    giaiThich: bang.giaiThich,
    luuY: bang.luuY,
    phu: null,
  };
  if (bang.phu) {
    ketQua.phu = {
      gia: dongMoiDonViSan / bang.phu.heSo,
      donVi: bang.phu.donViVN,
    };
  }
  return ketQua;
}

/**
 * Viết số tiền đồng cho dễ đọc.
 *
 * @param {number}  so      số tiền
 * @param {boolean} rutGon  true → rút thành "136,5 triệu"; false → ghi đủ chữ số
 */
export function tienVN(so, rutGon = false) {
  if (so === null || so === undefined || Number.isNaN(so)) return "—";

  if (rutGon) {
    if (Math.abs(so) >= 1_000_000_000)
      return (so / 1_000_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 2 }) + " tỷ";
    if (Math.abs(so) >= 1_000_000)
      return (so / 1_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 1 }) + " triệu";
  }

  // Dưới 1.000 đồng thì giữ một chữ số lẻ, còn lại làm tròn đến đồng
  const soLe = Math.abs(so) < 1000 ? 1 : 0;
  return so.toLocaleString("vi-VN", { minimumFractionDigits: soLe, maximumFractionDigits: soLe });
}

// Câu miễn trừ trách nhiệm dùng chung ở mọi nơi hiện giá quy đổi.
// Đặt một chỗ để sửa một lần là đổi hết, không sót trang nào.
export const MIEN_TRU =
  "Số quy đổi trên là phép tính thô: giá sàn × tỷ giá × hệ số đổi đơn vị. " +
  "Chưa gồm thuế, cước vận chuyển, bảo hiểm, chi phí chế biến và lãi phân phối, " +
  "cũng chưa tính chênh lệch chất lượng. Đây KHÔNG phải giá mua bán tại Việt Nam " +
  "và không phải khuyến nghị đầu tư.";
