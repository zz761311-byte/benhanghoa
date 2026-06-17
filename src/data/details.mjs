// ============================================================
// Nội dung chi tiết cho trang từng mặt hàng (SEO + thông số hợp đồng + FAQ).
//
// ⚠️ LƯU Ý: Thông số hợp đồng MXV dưới đây là SỐ LIỆU THAM KHẢO mình tổng hợp.
//    Vui lòng RÀ SOÁT lại với MXV / bộ phận tư vấn trước khi công bố chính thức.
//    Mức KÝ QUỸ thay đổi thường xuyên nên KHÔNG ghi cứng — để "liên hệ tư vấn".
//    Phần cố định (độ lớn hợp đồng, bước giá, sàn, đơn vị) gần như không đổi.
// ============================================================

export const DETAILS = {
  // ===================== KIM LOẠI =====================
  "vang": {
    intro: "Vàng (XAU/USD) là kim loại quý được xem như tài sản trú ẩn an toàn hàng đầu thế giới. Giá vàng phản ứng mạnh với lãi suất, lạm phát, sức mạnh đồng USD và các bất ổn địa chính trị.",
    mxv: null,
    mxvNote: "Vàng hiện KHÔNG nằm trong danh mục sản phẩm giao dịch của MXV. Giá hiển thị là giá vàng thế giới (spot, XAU/USD) chỉ mang tính tham khảo.",
    drivers: [
      "Lãi suất & chính sách của Fed (lãi suất tăng thường gây áp lực giảm giá vàng)",
      "Lạm phát và sức mạnh đồng USD",
      "Bất ổn địa chính trị, nhu cầu trú ẩn an toàn",
      "Dòng vốn vào/ra các quỹ ETF vàng"
    ],
    faq: [
      { q: "Giá vàng trên trang này là giá nào?", a: "Là giá vàng thế giới (spot XAU/USD), khác với giá vàng SJC/nhẫn trong nước." },
      { q: "Có giao dịch vàng qua MXV không?", a: "Hiện MXV không có sản phẩm vàng. Vàng được quản lý riêng theo quy định trong nước." }
    ]
  },

  "bac": {
    intro: "Bạc (XAG/USD) vừa là kim loại quý vừa là kim loại công nghiệp (dùng nhiều trong điện tử, pin mặt trời). Vì vậy giá bạc chịu tác động kép từ nhu cầu trú ẩn lẫn nhu cầu sản xuất, thường biến động mạnh hơn vàng.",
    mxv: {
      ma: "SIE", san: "Sở COMEX (Mỹ)", donVi: "USD/troy ounce",
      doLon: "5.000 troy ounce / hợp đồng", buocGia: "0,005 USD (≈ 25 USD/hợp đồng)",
      thang: "Theo lịch niêm yết của COMEX", gio: "Gần như 24h các ngày trong tuần (giờ Việt Nam)"
    },
    drivers: [
      "Nhu cầu công nghiệp (điện tử, pin năng lượng mặt trời)",
      "Diễn biến giá vàng (bạc thường đi cùng hướng)",
      "Lãi suất, lạm phát, sức mạnh USD",
      "Tỷ lệ vàng/bạc (gold-silver ratio)"
    ],
    faq: [
      { q: "Bạc giao dịch qua MXV theo mã nào?", a: "Mã tham khảo SIE (Bạc COMEX), độ lớn 5.000 troy ounce/hợp đồng." },
      { q: "Vì sao giá bạc biến động mạnh?", a: "Vì bạc vừa là kim loại quý vừa là kim loại công nghiệp, lại có quy mô thị trường nhỏ hơn vàng." }
    ]
  },

  "bach-kim": {
    intro: "Bạch kim (XPT/USD) là kim loại quý hiếm, dùng nhiều trong bộ chuyển đổi xúc tác ô tô, trang sức và công nghiệp. Nguồn cung tập trung chủ yếu ở Nam Phi nên giá nhạy với gián đoạn sản xuất.",
    mxv: {
      ma: "PLE", san: "Sở NYMEX (Mỹ)", donVi: "USD/troy ounce",
      doLon: "50 troy ounce / hợp đồng", buocGia: "0,1 USD (≈ 5 USD/hợp đồng)",
      thang: "Theo lịch niêm yết của NYMEX", gio: "Gần như 24h các ngày trong tuần (giờ Việt Nam)"
    },
    drivers: [
      "Nhu cầu ngành ô tô (bộ chuyển đổi xúc tác)",
      "Nguồn cung từ Nam Phi (đình công, thiếu điện)",
      "Chênh lệch giá với vàng & palladium",
      "Xu hướng xe điện (ảnh hưởng dài hạn tới nhu cầu)"
    ],
    faq: [
      { q: "Bạch kim giao dịch qua MXV mã nào?", a: "Mã tham khảo PLE (Bạch kim NYMEX), độ lớn 50 troy ounce/hợp đồng." },
      { q: "Vì sao giá bạch kim phụ thuộc Nam Phi?", a: "Vì phần lớn sản lượng bạch kim thế giới đến từ Nam Phi, nên sự cố sản xuất ở đây tác động mạnh tới giá." }
    ]
  },

  "dong": {
    intro: "Đồng (XCU/USD) là kim loại công nghiệp quan trọng bậc nhất, được ví như 'tiến sĩ Đồng' (Dr. Copper) vì giá của nó phản ánh sức khỏe kinh tế toàn cầu. Đồng dùng nhiều trong xây dựng, điện, xe điện và năng lượng tái tạo.",
    mxv: {
      ma: "CPE", san: "Sở COMEX (Mỹ)", donVi: "USD/pound",
      doLon: "25.000 pound / hợp đồng", buocGia: "0,0005 USD (≈ 12,5 USD/hợp đồng)",
      thang: "Theo lịch niêm yết của COMEX", gio: "Gần như 24h các ngày trong tuần (giờ Việt Nam)"
    },
    drivers: [
      "Tăng trưởng kinh tế & sản xuất, đặc biệt Trung Quốc",
      "Nhu cầu xe điện và năng lượng tái tạo (đồng là vật liệu cốt lõi)",
      "Tồn kho trên các sàn LME/COMEX/SHFE",
      "Gián đoạn nguồn cung từ các mỏ lớn (Chile, Peru)"
    ],
    faq: [
      { q: "Đồng giao dịch qua MXV mã nào?", a: "Mã tham khảo CPE (Đồng COMEX), độ lớn 25.000 pound/hợp đồng." },
      { q: "Vì sao đồng được coi là 'phong vũ biểu' kinh tế?", a: "Vì đồng dùng rộng khắp trong sản xuất & xây dựng, nên cầu đồng tăng/giảm phản ánh chu kỳ kinh tế." }
    ]
  },

  "quang-sat": {
    intro: "Quặng sắt là nguyên liệu chính để luyện thép. Trung Quốc tiêu thụ phần lớn quặng sắt thế giới, còn Úc và Brazil là các nhà cung cấp lớn nhất. Giá quặng sắt phản ánh sức khỏe ngành xây dựng và sản xuất thép của Trung Quốc.",
    mxv: {
      ma: "FEF (Quặng sắt 62% Fe)", san: "Sở SGX (Singapore)", donVi: "USD/tấn",
      doLon: "100 tấn / hợp đồng", buocGia: "0,01 USD (≈ 1 USD/hợp đồng)",
      thang: "Các tháng liên tục theo lịch niêm yết SGX", gio: "Theo giờ giao dịch Sở SGX"
    },
    drivers: [
      "Nhu cầu thép & xây dựng của Trung Quốc",
      "Sản lượng xuất khẩu của Úc và Brazil",
      "Chính sách kích thích kinh tế / bất động sản Trung Quốc",
      "Tồn kho quặng tại các cảng Trung Quốc"
    ],
    faq: [
      { q: "Vì sao giá quặng sắt phụ thuộc Trung Quốc?", a: "Vì Trung Quốc sản xuất hơn một nửa lượng thép thế giới, nên nhu cầu quặng sắt gắn chặt với ngành bất động sản và hạ tầng của nước này." }
    ]
  },

  "nhom": {
    intro: "Nhôm là kim loại công nghiệp nhẹ, dùng nhiều trong giao thông, xây dựng, bao bì và điện. Sản xuất nhôm tiêu tốn rất nhiều điện năng nên giá nhôm nhạy với chi phí năng lượng, đặc biệt tại Trung Quốc và châu Âu.",
    mxv: {
      ma: "Nhôm LME", san: "Sở LME (London)", donVi: "USD/tấn",
      doLon: "25 tấn / hợp đồng", buocGia: "0,5 USD (≈ 12,5 USD/hợp đồng)",
      thang: "Hợp đồng kỳ hạn theo niêm yết LME (phổ biến kỳ hạn 3 tháng)", gio: "Theo giờ giao dịch Sở LME"
    },
    drivers: [
      "Chi phí điện năng (luyện nhôm tiêu tốn nhiều điện)",
      "Sản lượng & chính sách của Trung Quốc",
      "Tồn kho trên sàn LME/SHFE",
      "Nhu cầu từ ngành ô tô, xây dựng, bao bì"
    ],
    faq: [
      { q: "Nhôm giao dịch trên sàn nào?", a: "Tham chiếu phổ biến là hợp đồng Nhôm trên Sở LME (London), độ lớn 25 tấn/hợp đồng. Vui lòng xác nhận mã & thông số với MXV." }
    ]
  },

  "kem": {
    intro: "Kẽm chủ yếu dùng để mạ chống gỉ cho thép (mạ kẽm), ngoài ra có trong hợp kim và pin. Giá kẽm gắn với ngành xây dựng, hạ tầng và nguồn cung từ các mỏ lớn.",
    mxv: {
      ma: "Kẽm LME", san: "Sở LME (London)", donVi: "USD/tấn",
      doLon: "25 tấn / hợp đồng", buocGia: "0,5 USD (≈ 12,5 USD/hợp đồng)",
      thang: "Hợp đồng kỳ hạn theo niêm yết LME (phổ biến kỳ hạn 3 tháng)", gio: "Theo giờ giao dịch Sở LME"
    },
    drivers: [
      "Nhu cầu mạ kẽm cho thép (xây dựng, hạ tầng)",
      "Sản lượng từ các mỏ kẽm lớn",
      "Tồn kho trên sàn LME",
      "Tăng trưởng kinh tế & sản xuất công nghiệp"
    ],
    faq: [
      { q: "Kẽm được dùng để làm gì nhiều nhất?", a: "Phần lớn kẽm dùng để mạ chống gỉ cho thép (mạ kẽm), nên giá kẽm gắn chặt với ngành xây dựng và hạ tầng." }
    ]
  },

  "chi": {
    intro: "Chì được dùng chủ yếu trong sản xuất ắc quy (đặc biệt ắc quy axit-chì cho xe và lưu trữ điện). Giá chì gắn với ngành ô tô, xe máy và nhu cầu thay thế ắc quy.",
    mxv: {
      ma: "Chì LME", san: "Sở LME (London)", donVi: "USD/tấn",
      doLon: "25 tấn / hợp đồng", buocGia: "0,5 USD (≈ 12,5 USD/hợp đồng)",
      thang: "Hợp đồng kỳ hạn theo niêm yết LME (phổ biến kỳ hạn 3 tháng)", gio: "Theo giờ giao dịch Sở LME"
    },
    drivers: [
      "Nhu cầu ắc quy axit-chì (ô tô, xe máy, lưu trữ điện)",
      "Hoạt động tái chế chì",
      "Sản lượng khai thác & tồn kho LME",
      "Tăng trưởng sản xuất công nghiệp"
    ],
    faq: [
      { q: "Chì dùng nhiều nhất vào việc gì?", a: "Khoảng 80% nhu cầu chì đến từ sản xuất ắc quy axit-chì, nên giá chì gắn với ngành ô tô, xe máy và lưu trữ điện." }
    ]
  },

  "niken": {
    intro: "Niken dùng nhiều trong thép không gỉ và ngày càng quan trọng cho pin xe điện. Indonesia là nước sản xuất niken lớn nhất. Giá niken biến động mạnh theo nhu cầu pin EV và chính sách xuất khẩu của Indonesia.",
    mxv: {
      ma: "Niken LME", san: "Sở LME (London)", donVi: "USD/tấn",
      doLon: "6 tấn / hợp đồng", buocGia: "5 USD (≈ 30 USD/hợp đồng)",
      thang: "Hợp đồng kỳ hạn theo niêm yết LME (phổ biến kỳ hạn 3 tháng)", gio: "Theo giờ giao dịch Sở LME"
    },
    drivers: [
      "Nhu cầu thép không gỉ (chiếm phần lớn tiêu thụ niken)",
      "Nhu cầu pin xe điện (EV)",
      "Chính sách khai thác & xuất khẩu của Indonesia",
      "Tồn kho trên sàn LME"
    ],
    faq: [
      { q: "Vì sao niken ngày càng được chú ý?", a: "Vì ngoài thép không gỉ, niken là vật liệu quan trọng cho pin xe điện, nên nhu cầu được kỳ vọng tăng theo xu hướng điện khí hóa." }
    ]
  },

  "thiec": {
    intro: "Thiếc dùng chủ yếu để hàn (mối hàn linh kiện điện tử), mạ và hợp kim. Nguồn cung tập trung ở một số nước (Trung Quốc, Indonesia, Myanmar) nên thị trường thiếc nhỏ và dễ biến động mạnh.",
    mxv: {
      ma: "Thiếc LME", san: "Sở LME (London)", donVi: "USD/tấn",
      doLon: "5 tấn / hợp đồng", buocGia: "Theo niêm yết LME (vui lòng xác nhận)",
      thang: "Hợp đồng kỳ hạn theo niêm yết LME (phổ biến kỳ hạn 3 tháng)", gio: "Theo giờ giao dịch Sở LME"
    },
    drivers: [
      "Nhu cầu hàn trong sản xuất điện tử & bán dẫn",
      "Nguồn cung từ Indonesia, Myanmar, Trung Quốc",
      "Tồn kho trên sàn LME (thị trường nhỏ, dễ biến động)",
      "Chu kỳ ngành điện tử toàn cầu"
    ],
    faq: [
      { q: "Vì sao giá thiếc dễ biến động mạnh?", a: "Vì thị trường thiếc nhỏ và nguồn cung tập trung ở ít quốc gia, nên một thay đổi nhỏ về cung – cầu cũng có thể tạo biến động giá lớn." }
    ]
  },

  // ===================== NĂNG LƯỢNG =====================
  "dau-tho-wti": {
    intro: "Dầu thô WTI (West Texas Intermediate) là loại dầu ngọt nhẹ chuẩn của thị trường Mỹ, một trong hai tham chiếu giá dầu quan trọng nhất thế giới (cùng với Brent). Giá WTI phản ánh cung – cầu dầu của Mỹ và tâm lý rủi ro toàn cầu.",
    mxv: {
      ma: "CLE", san: "Sở NYMEX (Mỹ)", donVi: "USD/thùng",
      doLon: "1.000 thùng / hợp đồng", buocGia: "0,01 USD (≈ 10 USD/hợp đồng)",
      thang: "Các tháng từ 1–12 theo lịch niêm yết NYMEX", gio: "Gần như 24h các ngày trong tuần (giờ Việt Nam)"
    },
    drivers: [
      "Quyết định sản lượng của OPEC+ và tồn kho dầu Mỹ (EIA)",
      "Tăng trưởng kinh tế & nhu cầu tiêu thụ nhiên liệu toàn cầu",
      "Căng thẳng địa chính trị tại các vùng sản xuất dầu",
      "Sức mạnh đồng USD và tâm lý risk-on/risk-off"
    ],
    faq: [
      { q: "WTI và Brent khác nhau thế nào?", a: "WTI là dầu chuẩn của Mỹ (giao tại Cushing, Oklahoma), Brent là dầu chuẩn của châu Âu/Biển Bắc. Brent thường nhỉnh giá hơn WTI." },
      { q: "Dầu WTI giao dịch qua MXV mã nào?", a: "Mã tham khảo CLE (Dầu thô WTI, NYMEX), độ lớn 1.000 thùng/hợp đồng." }
    ]
  },

  "dau-brent": {
    intro: "Dầu Brent là dầu thô chuẩn của khu vực Biển Bắc, được dùng làm tham chiếu cho khoảng 2/3 lượng dầu giao dịch trên thế giới. Giá Brent nhạy với nguồn cung từ Trung Đông, châu Phi và các biến động địa chính trị.",
    mxv: {
      ma: "Dầu Brent (ICE)", san: "Sở ICE (Anh)", donVi: "USD/thùng",
      doLon: "1.000 thùng / hợp đồng", buocGia: "0,01 USD (≈ 10 USD/hợp đồng)",
      thang: "Các tháng từ 1–12 theo lịch niêm yết ICE", gio: "Gần như 24h các ngày trong tuần (giờ Việt Nam)"
    },
    drivers: [
      "Quyết định sản lượng của OPEC+",
      "Căng thẳng địa chính trị Trung Đông & vùng sản xuất dầu",
      "Nhu cầu dầu toàn cầu và tăng trưởng kinh tế",
      "Tồn kho dầu và sức mạnh đồng USD"
    ],
    faq: [
      { q: "Vì sao Brent là tham chiếu giá dầu quan trọng nhất?", a: "Vì phần lớn dầu thô giao dịch quốc tế được định giá tham chiếu theo Brent, đặc biệt là dầu từ châu Âu, châu Phi và Trung Đông." }
    ]
  },

  "khi-tu-nhien": {
    intro: "Khí tự nhiên (Natural Gas) là nhiên liệu quan trọng cho phát điện và sưởi ấm. Giá khí biến động rất mạnh theo mùa và thời tiết, đặc biệt vào mùa đông ở Bắc bán cầu.",
    mxv: {
      ma: "NGE", san: "Sở NYMEX (Mỹ)", donVi: "USD/MMBtu",
      doLon: "10.000 MMBtu / hợp đồng", buocGia: "0,001 USD (≈ 10 USD/hợp đồng)",
      thang: "Các tháng từ 1–12 theo lịch niêm yết NYMEX", gio: "Gần như 24h các ngày trong tuần (giờ Việt Nam)"
    },
    drivers: [
      "Thời tiết & nhu cầu sưởi/làm mát theo mùa",
      "Mức tồn kho khí (báo cáo EIA hàng tuần)",
      "Sản lượng khí đá phiến của Mỹ và công suất xuất khẩu LNG",
      "Giá năng lượng thay thế (than, dầu)"
    ],
    faq: [
      { q: "Vì sao giá khí tự nhiên biến động mạnh?", a: "Vì nhu cầu khí phụ thuộc nhiều vào thời tiết (sưởi mùa đông, điều hòa mùa hè) và khó lưu trữ, nên giá có thể dao động rất lớn trong thời gian ngắn." }
    ]
  },

  "xang-rbob": {
    intro: "Xăng RBOB (Reformulated Blendstock for Oxygenate Blending) là xăng pha chế chuẩn giao dịch tại Mỹ. Giá RBOB bám sát giá dầu thô nhưng còn chịu ảnh hưởng của mùa lái xe cao điểm và công suất lọc dầu.",
    mxv: {
      ma: "RBE", san: "Sở NYMEX (Mỹ)", donVi: "USD/gallon",
      doLon: "42.000 gallon / hợp đồng", buocGia: "0,0001 USD (≈ 4,2 USD/hợp đồng)",
      thang: "Các tháng từ 1–12 theo lịch niêm yết NYMEX", gio: "Gần như 24h các ngày trong tuần (giờ Việt Nam)"
    },
    drivers: [
      "Giá dầu thô WTI/Brent (nguyên liệu đầu vào)",
      "Mùa lái xe cao điểm tại Mỹ (mùa hè)",
      "Công suất & sự cố nhà máy lọc dầu",
      "Tồn kho xăng của Mỹ (EIA)"
    ],
    faq: [
      { q: "Xăng RBOB là gì?", a: "Là loại xăng pha chế tiêu chuẩn được giao dịch tại Mỹ, dùng làm tham chiếu giá xăng bán buôn. Giá RBOB biến động theo giá dầu và mùa tiêu thụ." }
    ]
  },

  // ===================== NÔNG SẢN =====================
  "ngo": {
    intro: "Ngô là một trong những nông sản giao dịch lớn nhất thế giới, dùng làm thức ăn chăn nuôi, thực phẩm và sản xuất ethanol. Mỹ là nước sản xuất – xuất khẩu ngô hàng đầu, nên giá nhạy với thời tiết vùng Trung Tây.",
    mxv: {
      ma: "ZCE", san: "Sở CBOT (Mỹ)", donVi: "cents/giạ (bushel)",
      doLon: "5.000 giạ / hợp đồng", buocGia: "1/4 cent (≈ 12,5 USD/hợp đồng)",
      thang: "Tháng 3, 5, 7, 9, 12", gio: "Theo phiên giao dịch CBOT (giờ Việt Nam)"
    },
    drivers: [
      "Thời tiết mùa vụ tại vùng Trung Tây nước Mỹ",
      "Báo cáo cung – cầu USDA (WASDE, mùa vụ, tồn kho)",
      "Nhu cầu thức ăn chăn nuôi và sản xuất ethanol",
      "Tỷ giá USD và nhu cầu nhập khẩu của Trung Quốc"
    ],
    faq: [
      { q: "Ngô giao dịch qua MXV mã nào?", a: "Mã tham khảo ZCE (Ngô CBOT), độ lớn 5.000 giạ/hợp đồng (1 giạ ngô ≈ 25,4 kg)." },
      { q: "Yếu tố nào ảnh hưởng giá ngô mạnh nhất?", a: "Thời tiết vùng trồng ngô của Mỹ và các báo cáo cung – cầu của USDA là hai yếu tố tác động mạnh nhất." }
    ]
  },

  "dau-tuong": {
    intro: "Đậu tương (soybean) là nông sản chiến lược dùng để ép dầu ăn và làm khô đậu (thức ăn chăn nuôi). Giá đậu tương liên kết chặt với khô đậu, dầu đậu và nhu cầu khổng lồ từ Trung Quốc.",
    mxv: {
      ma: "ZSE", san: "Sở CBOT (Mỹ)", donVi: "cents/giạ (bushel)",
      doLon: "5.000 giạ / hợp đồng", buocGia: "1/4 cent (≈ 12,5 USD/hợp đồng)",
      thang: "Tháng 1, 3, 5, 7, 8, 9, 11", gio: "Theo phiên giao dịch CBOT (giờ Việt Nam)"
    },
    drivers: [
      "Nhu cầu nhập khẩu của Trung Quốc (nước mua lớn nhất)",
      "Thời tiết tại Mỹ và Nam Mỹ (Brazil, Argentina)",
      "Biên lợi nhuận ép dầu (crush spread) của khô đậu & dầu đậu",
      "Báo cáo USDA và căng thẳng thương mại Mỹ – Trung"
    ],
    faq: [
      { q: "Đậu tương liên quan gì tới khô đậu và dầu đậu?", a: "Khi ép đậu tương sẽ thu được khô đậu (thức ăn chăn nuôi) và dầu đậu (dầu ăn/biodiesel), nên giá ba mặt hàng này liên kết chặt với nhau." }
    ]
  },

  "kho-dau-tuong": {
    intro: "Khô đậu tương (soybean meal) là phụ phẩm sau khi ép dầu từ đậu tương, là nguồn đạm chính trong thức ăn chăn nuôi. Giá khô đậu phụ thuộc vào giá đậu tương và nhu cầu chăn nuôi heo, gia cầm.",
    mxv: {
      ma: "ZME", san: "Sở CBOT (Mỹ)", donVi: "USD/tấn ngắn (short ton)",
      doLon: "100 tấn ngắn / hợp đồng", buocGia: "0,1 USD (≈ 10 USD/hợp đồng)",
      thang: "Tháng 1, 3, 5, 7, 8, 9, 10, 12", gio: "Theo phiên giao dịch CBOT (giờ Việt Nam)"
    },
    drivers: [
      "Giá đậu tương (nguyên liệu đầu vào)",
      "Nhu cầu thức ăn chăn nuôi (heo, gia cầm, thủy sản)",
      "Biên lợi nhuận ép dầu đậu tương",
      "Dịch bệnh trên đàn vật nuôi (ảnh hưởng nhu cầu)"
    ],
    faq: [
      { q: "Khô đậu tương dùng để làm gì?", a: "Khô đậu tương là nguồn đạm chính trong thức ăn chăn nuôi, nên giá gắn chặt với quy mô ngành chăn nuôi heo và gia cầm." }
    ]
  },

  "dau-dau-tuong": {
    intro: "Dầu đậu tương (soybean oil) là dầu thực vật được tiêu thụ rộng rãi để nấu ăn và sản xuất nhiên liệu sinh học (biodiesel). Giá dầu đậu gắn với chính sách nhiên liệu sinh học và giá dầu cọ cạnh tranh.",
    mxv: {
      ma: "ZLE", san: "Sở CBOT (Mỹ)", donVi: "cents/pound",
      doLon: "60.000 pound / hợp đồng", buocGia: "0,01 cent (≈ 6 USD/hợp đồng)",
      thang: "Tháng 1, 3, 5, 7, 8, 9, 10, 12", gio: "Theo phiên giao dịch CBOT (giờ Việt Nam)"
    },
    drivers: [
      "Chính sách nhiên liệu sinh học (biodiesel) của Mỹ",
      "Giá dầu cọ (sản phẩm thay thế) và dầu thô",
      "Sản lượng ép đậu tương",
      "Nhu cầu dầu ăn toàn cầu"
    ],
    faq: [
      { q: "Vì sao giá dầu đậu tương liên quan tới giá dầu thô?", a: "Vì dầu đậu tương có thể dùng sản xuất biodiesel, nên khi giá dầu thô tăng, nhu cầu làm nhiên liệu sinh học có thể đẩy giá dầu đậu lên theo." }
    ]
  },

  "lua-mi": {
    intro: "Lúa mì là lương thực thiết yếu của hàng tỷ người. Giá lúa mì nhạy với thời tiết tại các vùng trồng lớn (Mỹ, Nga, EU, Ukraine) và các biến động địa chính trị ảnh hưởng tới xuất khẩu vùng Biển Đen.",
    mxv: {
      ma: "ZWA", san: "Sở CBOT (Mỹ)", donVi: "cents/giạ (bushel)",
      doLon: "5.000 giạ / hợp đồng", buocGia: "1/4 cent (≈ 12,5 USD/hợp đồng)",
      thang: "Tháng 3, 5, 7, 9, 12", gio: "Theo phiên giao dịch CBOT (giờ Việt Nam)"
    },
    drivers: [
      "Thời tiết & sản lượng tại Mỹ, Nga, EU, Ukraine",
      "Tình hình xuất khẩu vùng Biển Đen (Nga – Ukraine)",
      "Báo cáo USDA và tồn kho toàn cầu",
      "Chính sách xuất khẩu của các nước sản xuất lớn"
    ],
    faq: [
      { q: "Vì sao giá lúa mì nhạy với tình hình Nga – Ukraine?", a: "Vì Nga và Ukraine là những nước xuất khẩu lúa mì hàng đầu qua vùng Biển Đen, nên gián đoạn ở đây có thể đẩy giá lúa mì toàn cầu tăng mạnh." }
    ]
  },

  // ===================== NGUYÊN LIỆU CÔNG NGHIỆP =====================
  "ca-phe-arabica": {
    intro: "Cà phê Arabica là loại cà phê chất lượng cao, chiếm phần lớn cà phê đặc sản thế giới. Brazil và Colombia là nguồn cung chính, nên giá Arabica nhạy với thời tiết (sương giá, hạn hán) tại Brazil.",
    mxv: {
      ma: "KCE", san: "Sở ICE US (Mỹ)", donVi: "cents/pound",
      doLon: "37.500 pound / hợp đồng", buocGia: "0,05 cent (≈ 18,75 USD/hợp đồng)",
      thang: "Tháng 3, 5, 7, 9, 12", gio: "Theo phiên giao dịch ICE US (giờ Việt Nam)"
    },
    drivers: [
      "Thời tiết tại Brazil (sương giá, hạn hán)",
      "Sản lượng & tồn kho cà phê toàn cầu",
      "Tỷ giá đồng Real Brazil so với USD",
      "Nhu cầu tiêu thụ cà phê toàn cầu"
    ],
    faq: [
      { q: "Arabica và Robusta khác nhau ra sao?", a: "Arabica hương vị tinh tế, trồng ở vùng cao, giá cao hơn; Robusta đắng và nhiều caffeine hơn, chịu nhiệt tốt, giá rẻ hơn. Việt Nam là nước xuất khẩu Robusta số 1 thế giới." },
      { q: "Cà phê Arabica qua MXV mã nào?", a: "Mã tham khảo KCE (Arabica, ICE US), độ lớn 37.500 pound/hợp đồng." }
    ]
  },

  "ca-phe-robusta": {
    intro: "Cà phê Robusta là loại cà phê đắng, hàm lượng caffeine cao, dùng nhiều cho cà phê hòa tan và phối trộn. Việt Nam là quốc gia xuất khẩu Robusta lớn nhất thế giới, nên giá Robusta đặc biệt quan trọng với nông dân Việt.",
    mxv: {
      ma: "LRC", san: "Sở ICE EU (Anh)", donVi: "USD/tấn",
      doLon: "10 tấn / hợp đồng", buocGia: "1 USD (≈ 10 USD/hợp đồng)",
      thang: "Tháng 1, 3, 5, 7, 9, 11", gio: "Theo phiên giao dịch ICE EU (giờ Việt Nam)"
    },
    drivers: [
      "Sản lượng & xuất khẩu cà phê của Việt Nam",
      "Thời tiết tại Tây Nguyên và Brazil",
      "Tồn kho được chứng nhận trên sàn ICE EU",
      "Nhu cầu cà phê hòa tan toàn cầu"
    ],
    faq: [
      { q: "Vì sao giá Robusta quan trọng với Việt Nam?", a: "Vì Việt Nam là nước xuất khẩu Robusta số 1 thế giới; giá trên sàn London (ICE EU) ảnh hưởng trực tiếp tới thu nhập của nông dân Tây Nguyên." },
      { q: "Robusta giao dịch qua MXV mã nào?", a: "Mã tham khảo LRC (Robusta, ICE EU), độ lớn 10 tấn/hợp đồng." }
    ]
  },

  "duong": {
    intro: "Đường (đường thô số 11) là mặt hàng nông sản – nguyên liệu được giao dịch toàn cầu. Brazil, Ấn Độ và Thái Lan là các nguồn cung lớn. Giá đường còn liên quan tới giá ethanol vì mía có thể dùng để sản xuất nhiên liệu.",
    mxv: {
      ma: "SBE", san: "Sở ICE US (Mỹ)", donVi: "cents/pound",
      doLon: "112.000 pound / hợp đồng", buocGia: "0,01 cent (≈ 11,2 USD/hợp đồng)",
      thang: "Tháng 3, 5, 7, 10", gio: "Theo phiên giao dịch ICE US (giờ Việt Nam)"
    },
    drivers: [
      "Sản lượng mía tại Brazil, Ấn Độ, Thái Lan",
      "Giá dầu & ethanol (mía có thể dùng sản xuất ethanol)",
      "Chính sách xuất khẩu của Ấn Độ",
      "Tỷ giá đồng Real Brazil"
    ],
    faq: [
      { q: "Vì sao giá đường liên quan tới giá dầu?", a: "Vì tại Brazil, mía có thể dùng để sản xuất đường hoặc ethanol; khi giá dầu/ethanol cao, nhà máy ưu tiên làm ethanol, giảm nguồn cung đường và đẩy giá đường lên." }
    ]
  },

  "cacao": {
    intro: "Cacao là nguyên liệu chính làm sô-cô-la. Nguồn cung tập trung ở Tây Phi (Bờ Biển Ngà và Ghana chiếm phần lớn sản lượng), nên giá cacao rất nhạy với thời tiết và dịch bệnh cây trồng tại khu vực này.",
    mxv: {
      ma: "CCE", san: "Sở ICE US (Mỹ)", donVi: "USD/tấn",
      doLon: "10 tấn / hợp đồng", buocGia: "1 USD (≈ 10 USD/hợp đồng)",
      thang: "Tháng 3, 5, 7, 9, 12", gio: "Theo phiên giao dịch ICE US (giờ Việt Nam)"
    },
    drivers: [
      "Thời tiết & dịch bệnh cây tại Bờ Biển Ngà, Ghana",
      "Sản lượng vụ mùa Tây Phi",
      "Nhu cầu sô-cô-la toàn cầu",
      "Chính sách giá thu mua của các nước sản xuất"
    ],
    faq: [
      { q: "Vì sao giá cacao phụ thuộc Tây Phi?", a: "Vì Bờ Biển Ngà và Ghana cung cấp phần lớn cacao thế giới, nên thời tiết và dịch bệnh cây trồng tại đây tác động trực tiếp tới giá toàn cầu." }
    ]
  },

  "bong": {
    intro: "Bông sợi là nguyên liệu dệt may quan trọng. Mỹ, Ấn Độ, Trung Quốc và Brazil là các nước sản xuất lớn. Giá bông phụ thuộc vào thời tiết mùa vụ và sức khỏe ngành dệt may toàn cầu.",
    mxv: {
      ma: "CTE", san: "Sở ICE US (Mỹ)", donVi: "cents/pound",
      doLon: "50.000 pound / hợp đồng", buocGia: "0,01 cent (≈ 5 USD/hợp đồng)",
      thang: "Tháng 3, 5, 7, 10, 12", gio: "Theo phiên giao dịch ICE US (giờ Việt Nam)"
    },
    drivers: [
      "Thời tiết & sản lượng tại Mỹ, Ấn Độ",
      "Nhu cầu của ngành dệt may (đặc biệt Trung Quốc)",
      "Giá sợi tổng hợp cạnh tranh (polyester)",
      "Báo cáo USDA và xuất khẩu bông Mỹ"
    ],
    faq: [
      { q: "Yếu tố nào ảnh hưởng giá bông mạnh nhất?", a: "Thời tiết mùa vụ tại các nước trồng bông lớn và sức khỏe ngành dệt may toàn cầu (đặc biệt nhu cầu từ Trung Quốc) là hai yếu tố chính." }
    ]
  },

  "cao-su": {
    intro: "Cao su tự nhiên là nguyên liệu thiết yếu cho ngành lốp xe và sản phẩm công nghiệp. Thái Lan, Indonesia và Việt Nam là các nước sản xuất hàng đầu. Giá cao su gắn với ngành ô tô và giá dầu (cao su tổng hợp cạnh tranh).",
    mxv: null,
    mxvNote: "Trên MXV, cao su được giao dịch dưới dạng hợp đồng Cao su RSS3 (Sở OSE – Nhật Bản) và Cao su TSR20 (Sở SGX – Singapore). Thông số chi tiết và mức ký quỹ vui lòng liên hệ tư vấn. Giá hiển thị trên trang là giá tham chiếu thị trường khu vực.",
    drivers: [
      "Nhu cầu ngành lốp xe & sản xuất ô tô (đặc biệt Trung Quốc)",
      "Thời tiết & sản lượng tại Thái Lan, Indonesia, Việt Nam",
      "Giá dầu thô (ảnh hưởng cao su tổng hợp cạnh tranh)",
      "Tồn kho tại các sàn Thượng Hải, Nhật Bản"
    ],
    faq: [
      { q: "Cao su giao dịch qua MXV thế nào?", a: "MXV niêm yết Cao su RSS3 (Sở OSE – Nhật Bản) và TSR20 (Sở SGX – Singapore). Vui lòng liên hệ để biết thông số và mức ký quỹ hiện hành." }
    ]
  }
};
