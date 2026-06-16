// ============================================================
// Bến Hàng Hóa — Commodity catalog
// Maps each commodity to a TradingView symbol used by the widgets.
//
// SYMBOL STRATEGY (kiểm chứng qua cửa sổ ẩn danh = giống khách vãng lai):
//  - Kim loại quý + đồng + dầu: OANDA / TVC  → real-time free, công khai OK
//  - Kim loại cơ bản (LME), nông sản, nguyên liệu: CAPITALCOM (CFD) → real-time free
//  - Futures sàn CME/COMEX/CBOT/ICE (mã ...1!): KHÔNG hiện cho khách ẩn danh
//  - `limited: true` = mặt hàng KHÔNG có data free công khai (quặng sắt, cao su,
//    khô đậu, dầu đậu, cà phê Robusta). Vẫn liệt kê + đánh dấu để trung thực;
//    biểu đồ chỉ hiện cho người đã đăng nhập TradingView.
// ============================================================

window.BHH_SYMBOLS = {
  energy: {
    label: "Năng lượng",
    icon: "🛢️",
    items: [
      { name: "Dầu thô WTI", tv: "TVC:USOIL", unit: "USD/thùng" },
      { name: "Dầu Brent",   tv: "TVC:UKOIL", unit: "USD/thùng" },
      { name: "Khí tự nhiên", tv: "CAPITALCOM:NATURALGAS", unit: "USD/MMBtu" },
      { name: "Xăng RBOB",   tv: "CAPITALCOM:GASOLINE", unit: "USD/gallon" }
    ]
  },
  agri: {
    label: "Nông sản",
    icon: "🌾",
    items: [
      { name: "Ngô",            tv: "CAPITALCOM:CORN", unit: "cents/giạ" },
      { name: "Đậu tương",      tv: "CAPITALCOM:SOYBEAN", unit: "cents/giạ" },
      { name: "Khô đậu tương",  tv: "CBOT:ZM1!", unit: "USD/tấn ngắn", limited: true },
      { name: "Dầu đậu tương",  tv: "CBOT:ZL1!", unit: "cents/pound", limited: true },
      { name: "Lúa mì",         tv: "CAPITALCOM:WHEAT", unit: "cents/giạ" }
    ]
  },
  soft: {
    label: "Nguyên liệu CN",
    icon: "☕",
    items: [
      { name: "Cà phê Arabica", tv: "CAPITALCOM:COFFEE", unit: "cents/pound" },
      { name: "Cà phê Robusta", tv: "ICEEUR:RC1!", unit: "USD/tấn", limited: true },
      { name: "Đường",          tv: "CAPITALCOM:SUGAR", unit: "cents/pound" },
      { name: "Cacao",          tv: "CAPITALCOM:COCOA", unit: "USD/tấn" },
      { name: "Bông",           tv: "CAPITALCOM:COTTON", unit: "cents/pound" },
      { name: "Cao su",         tv: "SHFE:RU1!", unit: "CNY/tấn", limited: true }
    ]
  },
  metal: {
    label: "Kim loại",
    icon: "🥇",
    items: [
      { name: "Vàng",      tv: "OANDA:XAUUSD",         unit: "USD/oz" },
      { name: "Bạc",       tv: "OANDA:XAGUSD",         unit: "USD/oz" },
      { name: "Đồng",      tv: "OANDA:XCUUSD",         unit: "USD/pound" },
      { name: "Bạch kim",  tv: "OANDA:XPTUSD",         unit: "USD/oz" },
      { name: "Quặng sắt", tv: "SGX:FEF1!",            unit: "USD/tấn", limited: true },
      { name: "Nhôm",      tv: "CAPITALCOM:ALUMINUM",  unit: "USD/tấn" },
      { name: "Kẽm",       tv: "CAPITALCOM:ZINC",      unit: "USD/tấn" },
      { name: "Chì",       tv: "CAPITALCOM:LEAD",      unit: "USD/tấn" },
      { name: "Niken",     tv: "CAPITALCOM:NICKEL",    unit: "USD/tấn" },
      { name: "Thiếc",     tv: "CAPITALCOM:TIN",       unit: "USD/tấn" }
    ]
  }
};

// Symbols shown in the top scrolling ticker (đã kiểm chứng hiện được công khai).
window.BHH_TICKER = [
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

// Helper: flat list of all items.
window.BHH_ALL = Object.values(window.BHH_SYMBOLS)
  .flatMap(g => g.items.map(it => ({ ...it, group: g.label, icon: g.icon })));
