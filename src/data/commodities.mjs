// ============================================================
// Danh mục hàng hóa — nguồn dữ liệu DÙNG CHUNG cho bảng giá,
// thanh ticker, và sinh trang chi tiết từng mặt hàng (Astro import được).
//
// Ý nghĩa các trường:
//   tv      — mã biểu đồ TradingView (dùng cho widget biểu đồ)
//   yahoo   — mã lấy SỐ GIÁ về máy chủ mình (bot scripts/fetch-prices.mjs).
//             Không có mã này thì bảng giá chỉ hiện biểu đồ, không hiện số.
//   limited — chưa có dữ liệu miễn phí công khai, biểu đồ có thể không hiện
//             cho khách chưa đăng nhập TradingView
//
// ⚠️ Khi thêm mã `yahoo` mới, PHẢI kiểm bằng `npm run gia -- --thu` xem tên
//    hợp đồng trả về có đúng mặt hàng và còn hạn không. Đã từng gặp: mã RU=F
//    trả về đồng Rúp Nga (không phải cao su), ZNC=F trả hợp đồng hết hạn 2019.
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
      // Robusta giao dịch trên ICE châu Âu — chưa tìm được nguồn số miễn phí
      { name: "Cà phê Robusta", slug: "ca-phe-robusta", tv: "ICEEUR:RC1!",       unit: "USD/tấn", limited: true },
      { name: "Đường",          slug: "duong",          tv: "CAPITALCOM:SUGAR",  yahoo: "SB=F", unit: "cents/pound" },
      { name: "Cacao",          slug: "cacao",          tv: "CAPITALCOM:COCOA",  yahoo: "CC=F", unit: "USD/tấn" },
      { name: "Bông",           slug: "bong",           tv: "CAPITALCOM:COTTON", yahoo: "CT=F", unit: "cents/pound" },
      // Cao su giao dịch ở Thượng Hải — chưa tìm được nguồn số miễn phí
      { name: "Cao su",         slug: "cao-su",         tv: "SHFE:RU1!",         unit: "CNY/tấn", limited: true }
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
      { name: "Quặng sắt", slug: "quang-sat", tv: "SGX:FEF1!",           unit: "USD/tấn", limited: true },
      { name: "Nhôm",      slug: "nhom",      tv: "CAPITALCOM:ALUMINUM", yahoo: "ALI=F", unit: "USD/tấn" },
      // Kẽm, chì, niken, thiếc giao dịch trên LME — dữ liệu LME có bản quyền,
      // chưa tìm được nguồn số miễn phí hợp lệ. Chỉ hiện biểu đồ.
      { name: "Kẽm",       slug: "kem",       tv: "CAPITALCOM:ZINC",     unit: "USD/tấn" },
      { name: "Chì",       slug: "chi",       tv: "CAPITALCOM:LEAD",     unit: "USD/tấn" },
      { name: "Niken",     slug: "niken",     tv: "CAPITALCOM:NICKEL",   unit: "USD/tấn" },
      { name: "Thiếc",     slug: "thiec",     tv: "CAPITALCOM:TIN",      unit: "USD/tấn" }
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
