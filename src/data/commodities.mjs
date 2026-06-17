// ============================================================
// Danh mục hàng hóa — nguồn dữ liệu DÙNG CHUNG cho bảng giá,
// thanh ticker, và sinh trang chi tiết từng mặt hàng (Astro import được).
// `limited: true` = chưa có dữ liệu miễn phí công khai trên TradingView.
// ============================================================

export const GROUPS = [
  {
    key: "energy", label: "Năng lượng", icon: "🛢️",
    items: [
      { name: "Dầu thô WTI",  slug: "dau-tho-wti",  tv: "TVC:USOIL",            unit: "USD/thùng" },
      { name: "Dầu Brent",    slug: "dau-brent",    tv: "TVC:UKOIL",            unit: "USD/thùng" },
      { name: "Khí tự nhiên", slug: "khi-tu-nhien", tv: "CAPITALCOM:NATURALGAS", unit: "USD/MMBtu" },
      { name: "Xăng RBOB",    slug: "xang-rbob",    tv: "CAPITALCOM:GASOLINE",   unit: "USD/gallon" }
    ]
  },
  {
    key: "agri", label: "Nông sản", icon: "🌾",
    items: [
      { name: "Ngô",           slug: "ngo",           tv: "CAPITALCOM:CORN",    unit: "cents/giạ" },
      { name: "Đậu tương",     slug: "dau-tuong",     tv: "CAPITALCOM:SOYBEAN", unit: "cents/giạ" },
      { name: "Khô đậu tương", slug: "kho-dau-tuong", tv: "CBOT:ZM1!",          unit: "USD/tấn ngắn", limited: true },
      { name: "Dầu đậu tương", slug: "dau-dau-tuong", tv: "CBOT:ZL1!",          unit: "cents/pound",  limited: true },
      { name: "Lúa mì",        slug: "lua-mi",        tv: "CAPITALCOM:WHEAT",   unit: "cents/giạ" }
    ]
  },
  {
    key: "soft", label: "Nguyên liệu CN", icon: "☕",
    items: [
      { name: "Cà phê Arabica", slug: "ca-phe-arabica", tv: "CAPITALCOM:COFFEE", unit: "cents/pound" },
      { name: "Cà phê Robusta", slug: "ca-phe-robusta", tv: "ICEEUR:RC1!",       unit: "USD/tấn", limited: true },
      { name: "Đường",          slug: "duong",          tv: "CAPITALCOM:SUGAR",  unit: "cents/pound" },
      { name: "Cacao",          slug: "cacao",          tv: "CAPITALCOM:COCOA",  unit: "USD/tấn" },
      { name: "Bông",           slug: "bong",           tv: "CAPITALCOM:COTTON", unit: "cents/pound" },
      { name: "Cao su",         slug: "cao-su",         tv: "SHFE:RU1!",         unit: "CNY/tấn", limited: true }
    ]
  },
  {
    key: "metal", label: "Kim loại", icon: "🥇",
    items: [
      { name: "Vàng",      slug: "vang",      tv: "OANDA:XAUUSD",        unit: "USD/oz" },
      { name: "Bạc",       slug: "bac",       tv: "OANDA:XAGUSD",        unit: "USD/oz" },
      { name: "Đồng",      slug: "dong",      tv: "OANDA:XCUUSD",        unit: "USD/pound" },
      { name: "Bạch kim",  slug: "bach-kim",  tv: "OANDA:XPTUSD",        unit: "USD/oz" },
      { name: "Quặng sắt", slug: "quang-sat", tv: "SGX:FEF1!",           unit: "USD/tấn", limited: true },
      { name: "Nhôm",      slug: "nhom",      tv: "CAPITALCOM:ALUMINUM", unit: "USD/tấn" },
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
