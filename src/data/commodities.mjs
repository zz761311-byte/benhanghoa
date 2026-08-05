// ============================================================
// Danh mục hàng hóa — nguồn dữ liệu DÙNG CHUNG cho bảng giá,
// thanh ticker, và sinh trang chi tiết từng mặt hàng (Astro import được).
//
// Ý nghĩa các trường:
//   tv          — mã biểu đồ TradingView (dùng cho widget biểu đồ)
//   yahoo       — mã lấy SỐ GIÁ về máy chủ mình (bot scripts/fetch-prices.mjs)
//   chuaCoNguon — chưa tìm được nguồn giá đáng tin. Mặt hàng này KHÔNG hiện
//                 trong bảng giá và KHÔNG nạp khung TradingView nào. Trang chi
//                 tiết vẫn giữ (để không chết địa chỉ web) nhưng chỉ ghi rõ là
//                 chưa có dữ liệu.
//
// ⚠️ HAI BÀI HỌC — đọc trước khi thêm mã mới:
//
// 1. Mã `yahoo` mới phải kiểm bằng `npm run gia -- --thu`, xem tên hợp đồng trả
//    về có ĐÚNG mặt hàng và còn hạn không. Đã gặp: RU=F trả về đồng Rúp Nga
//    (không phải cao su); ZNC=F trả hợp đồng kẽm hết hạn từ 2019; TIO=F quặng
//    sắt có khối lượng giao dịch bằng 0 suốt 30 phiên.
//
// 2. Mã `tv` mới phải xem BẰNG MẮT trên trang thật, ở cửa sổ ẩn danh (tức là
//    giống khách vãng lai chưa đăng nhập TradingView). Mã nào TradingView không
//    phục vụ khách vãng lai thì nó TỰ KHỚP sang mã trùng tên và hiện giá của thứ
//    khác — không báo lỗi gì. Đã gặp: CAPITALCOM:TIN hiện giá cổ phiếu
//    CORNISH METALS INC. 1,11 USD trong khi thiếc thật khoảng 30.000 USD/tấn.
//    Công cụ tra cứu mã của TradingView KHÔNG phát hiện được lỗi này.
// ============================================================

export const GROUPS = [
  {
    key: "energy", label: "Năng lượng", icon: "🛢️",
    items: [
      { name: "Dầu thô WTI",  slug: "dau-tho-wti",  tv: "TVC:USOIL",            yahoo: "CL=F", unit: "USD/thùng" },
      { name: "Dầu Brent",    slug: "dau-brent",    tv: "TVC:UKOIL",            yahoo: "BZ=F", unit: "USD/thùng" },
      { name: "Khí tự nhiên", slug: "khi-tu-nhien", tv: "CAPITALCOM:NATURALGAS", yahoo: "NG=F", unit: "USD/MMBtu" },
      { name: "Xăng RBOB",    slug: "xang-rbob",    tv: "CAPITALCOM:GASOLINE",   yahoo: "RB=F", unit: "USD/gallon" }
    ]
  },
  {
    key: "agri", label: "Nông sản", icon: "🌾",
    items: [
      { name: "Ngô",           slug: "ngo",           tv: "CAPITALCOM:CORN",    yahoo: "ZC=F", unit: "cents/giạ" },
      { name: "Đậu tương",     slug: "dau-tuong",     tv: "CAPITALCOM:SOYBEAN", yahoo: "ZS=F", unit: "cents/giạ" },
      { name: "Khô đậu tương", slug: "kho-dau-tuong", tv: "CBOT:ZM1!",          yahoo: "ZM=F", unit: "USD/tấn ngắn" },
      { name: "Dầu đậu tương", slug: "dau-dau-tuong", tv: "CBOT:ZL1!",          yahoo: "ZL=F", unit: "cents/pound" },
      { name: "Lúa mì",        slug: "lua-mi",        tv: "CAPITALCOM:WHEAT",   yahoo: "ZW=F", unit: "cents/giạ" }
    ]
  },
  {
    key: "soft", label: "Nguyên liệu CN", icon: "☕",
    items: [
      { name: "Cà phê Arabica", slug: "ca-phe-arabica", tv: "CAPITALCOM:COFFEE", yahoo: "KC=F", unit: "cents/pound" },
      { name: "Cà phê Robusta", slug: "ca-phe-robusta", tv: "", unit: "USD/tấn", chuaCoNguon: true },
      { name: "Đường",          slug: "duong",          tv: "CAPITALCOM:SUGAR",  yahoo: "SB=F", unit: "cents/pound" },
      { name: "Cacao",          slug: "cacao",          tv: "CAPITALCOM:COCOA",  yahoo: "CC=F", unit: "USD/tấn" },
      { name: "Bông",           slug: "bong",           tv: "CAPITALCOM:COTTON", yahoo: "CT=F", unit: "cents/pound" },
      { name: "Cao su",         slug: "cao-su",         tv: "", unit: "CNY/tấn", chuaCoNguon: true }
    ]
  },
  {
    key: "metal", label: "Kim loại", icon: "🥇",
    items: [
      { name: "Vàng",      slug: "vang",      tv: "OANDA:XAUUSD",        yahoo: "GC=F",  unit: "USD/oz" },
      { name: "Bạc",       slug: "bac",       tv: "OANDA:XAGUSD",        yahoo: "SI=F",  unit: "USD/oz" },
      { name: "Đồng",      slug: "dong",      tv: "OANDA:XCUUSD",        yahoo: "HG=F",  unit: "USD/pound" },
      { name: "Bạch kim",  slug: "bach-kim",  tv: "OANDA:XPTUSD",        yahoo: "PL=F",  unit: "USD/oz" },
      // Quặng sắt: mã TIO=F trên Yahoo là hợp đồng gần như không giao dịch
      // (khối lượng 0 suốt 30 phiên, giá niêm yết lệch 73% so với chuỗi lịch sử)
      // → không dùng được. Chỉ hiện biểu đồ.
      { name: "Quặng sắt", slug: "quang-sat", tv: "", unit: "USD/tấn", chuaCoNguon: true },
      { name: "Nhôm",      slug: "nhom",      tv: "CAPITALCOM:ALUMINUM", yahoo: "ALI=F", unit: "USD/tấn" },
      { name: "Kẽm",       slug: "kem",       tv: "", unit: "USD/tấn", chuaCoNguon: true },
      { name: "Chì",       slug: "chi",       tv: "", unit: "USD/tấn", chuaCoNguon: true },
      { name: "Niken",     slug: "niken",     tv: "", unit: "USD/tấn", chuaCoNguon: true },
      { name: "Thiếc",     slug: "thiec",     tv: "", unit: "USD/tấn", chuaCoNguon: true }
    ]
  }
];

export const TICKER = [
  { proName: "TVC:GOLD",            title: "Vàng" },
  { proName: "TVC:SILVER",          title: "Bạc" },
  { proName: "OANDA:XCUUSD",        title: "Đồng" },
  { proName: "TVC:USOIL",           title: "Dầu WTI" },
  { proName: "TVC:UKOIL",           title: "Dầu Brent" },
  { proName: "CAPITALCOM:NATURALGAS", title: "Khí TN" },
  { proName: "CAPITALCOM:CORN",     title: "Ngô" },
  { proName: "CAPITALCOM:SOYBEAN",  title: "Đậu tương" },
  { proName: "CAPITALCOM:COFFEE",   title: "Cà phê" },
  { proName: "CAPITALCOM:ALUMINUM", title: "Nhôm" }
];

export const ALL = GROUPS.flatMap(g =>
  g.items.map(it => ({ ...it, group: g.label, groupKey: g.key, icon: g.icon }))
);
