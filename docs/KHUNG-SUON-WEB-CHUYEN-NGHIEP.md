# 🏗️ KHUNG SƯỜN WEB HÀNG HÓA CHUYÊN NGHIỆP — Bến Hàng Hóa

> Bản thiết kế tổng thể để phát triển từ MVP hiện tại thành một nền tảng
> thông tin hàng hóa chuyên nghiệp cho người Việt.

---

## MỤC LỤC
1. Định vị & mô hình kinh doanh
2. Bản đồ trang (Sitemap)
3. Tính năng theo module
4. Tầng dữ liệu (quan trọng nhất)
5. Kiến trúc kỹ thuật
6. Nội dung & SEO
7. Pháp lý & tuân thủ tại Việt Nam
8. Mô hình doanh thu
9. Lộ trình 5 pha
10. Hiện trạng vs Mục tiêu
11. Bộ công nghệ & chi phí đề xuất

---

## 1. ĐỊNH VỊ & MÔ HÌNH KINH DOANH

Trước khi xây, phải chốt web phục vụ mục tiêu nào (có thể kết hợp):

| Mô hình | Mục tiêu chính | Trang trọng tâm |
|---|---|---|
| **A. Cổng thông tin** | Giá + tin + phân tích, hút traffic | Bảng giá, Tin, SEO |
| **B. Portal môi giới MXV** | Phục vụ khách mở tài khoản giao dịch | Mở TK, Tư vấn, Bảng giá |
| **C. Đào tạo / Cộng đồng** | Bán khóa học, room tín hiệu | Học, Phân tích, Membership |
| **D. Media kiếm quảng cáo** | Lượt xem → quảng cáo/affiliate | Tin, Blog, SEO |

➡️ **Phần lớn web chuyên nghiệp = A làm nền + (B hoặc C) để kiếm tiền.**

---

## 2. BẢN ĐỒ TRANG (SITEMAP)

```
TRANG CHỦ (dashboard tổng quan: ticker, nổi bật, tin mới, lịch sự kiện)
│
├── BẢNG GIÁ
│   ├── Tổng hợp (theo 4 nhóm) · Heatmap · Top tăng/giảm
│   └── CHI TIẾT TỪNG MẶT HÀNG  ⭐ (trang riêng mỗi hàng hóa)
│       ├── Biểu đồ + giá real-time
│       ├── Lịch sử giá, bảng số liệu
│       ├── Thông số hợp đồng MXV (đơn vị, bước giá, ký quỹ, giờ GD)
│       ├── Tin & phân tích liên quan
│       └── Lịch đáo hạn, mùa vụ
│
├── TIN TỨC (danh mục, tag theo mặt hàng, tìm kiếm)
├── PHÂN TÍCH / NHẬN ĐỊNH (kỹ thuật + cơ bản, có biểu đồ)
├── LỊCH KINH TẾ (sự kiện, báo cáo WASDE/EIA/COT, đáo hạn)
├── KIẾN THỨC / HỌC (hàng hóa là gì, cách GD, thuật ngữ, FAQ)
├── CÔNG CỤ (máy tính ký quỹ, lãi/lỗ, quy đổi đơn vị)
├── VỀ CHÚNG TÔI / LIÊN HỆ / MỞ TÀI KHOẢN (nếu môi giới)
└── TÀI KHOẢN NGƯỜI DÙNG (watchlist, cảnh báo, hồ sơ)
```

⭐ **Trang chi tiết từng mặt hàng** là "vũ khí SEO" mạnh nhất — mỗi mặt hàng
là một trang riêng tối ưu từ khóa ("giá cà phê hôm nay", "giá đồng LME").

---

## 3. TÍNH NĂNG THEO MODULE

| Module | Tính năng | Mức độ |
|---|---|---|
| **Giá** | Real-time, watchlist, so sánh, heatmap, lịch sử, xuất CSV | Lõi |
| **Tin tức** | Auto-pull + dịch + biên tập, phân loại, tag theo mặt hàng | Lõi |
| **Phân tích** | Bài nhận định, gắn biểu đồ, tác giả, lượt xem | Quan trọng |
| **Cảnh báo giá** | Giá chạm mức → Email / Telegram / Zalo / Push | Giữ chân user |
| **Lịch kinh tế** | Sự kiện vĩ mô, báo cáo ngành, đáo hạn hợp đồng | Quan trọng |
| **Công cụ** | Máy tính ký quỹ, P/L, quy đổi đơn vị (giạ↔tấn, oz↔gram) | Tiện ích |
| **Tài khoản** | Đăng ký/đăng nhập, lưu watchlist & cảnh báo, hồ sơ | Pha sau |
| **CMS** | Biên tập viên đăng tin/bài KHÔNG cần code | Vận hành |
| **Cộng đồng** | Bình luận, room Zalo/Telegram, bản tin email | Tăng trưởng |

---

## 4. TẦNG DỮ LIỆU (QUAN TRỌNG NHẤT)

### 4.1. Dữ liệu GIÁ — 3 cấp độ nâng dần

| Cấp | Nguồn | Chi phí | Đặc điểm |
|---|---|---|---|
| **Free (hiện tại)** | Widget TradingView (TVC/OANDA/CFD) | 0đ | Nhúng được, ~20 mặt hàng, real-time CFD |
| **Pro** | API có license: Twelve Data, Barchart, EOD Historical | ~$30–100/tháng | Lấy được số thô → bảng giá tùy biến, lưu DB |
| **Chuẩn MXV** | Feed CQG chính thức (nếu là thành viên MXV) | Theo hợp đồng | Giá khớp sàn VN, real-time, hợp pháp phân phối |

➡️ **Lộ trình:** Free → khi có doanh thu → mua API Pro → nếu thành member MXV → feed CQG.

### 4.2. Dữ liệu TIN — pipeline biên tập

```
Nguồn RSS/AI  →  Dịch (máy → AI)  →  CMS biên tập viên duyệt  →  Đăng + Tag
(Reuters,                                   (sửa tiêu đề,            (gắn mặt hàng
 OilPrice,                                   chọn ảnh,                liên quan)
 Mining...)                                  thêm nhận định)
```

### 4.3. Dữ liệu LỊCH SỬ
- Lưu giá đóng cửa hàng ngày vào **database** → vẽ biểu đồ riêng, thống kê,
  so sánh, không phụ thuộc widget.

---

## 5. KIẾN TRÚC KỸ THUẬT

### Hiện tại (MVP tĩnh):
```
[Trình duyệt] → [Cloudflare Pages: HTML/CSS/JS] → [Widget TradingView]
                         ↑
                 [GitHub Actions: bot tin → news.json]
```

### Chuyên nghiệp (có backend + DB):
```
                    ┌──────────────────────────────┐
   [Người dùng] →   │  FRONTEND (Next.js / Astro)  │  SEO tốt, nhanh
                    │  - render trang chi tiết     │
                    └──────────────┬───────────────┘
                                   │ API
                    ┌──────────────▼───────────────┐
                    │  BACKEND (Cloudflare Workers  │
                    │  / Node serverless)          │
                    │  - Auth, watchlist, cảnh báo │
                    │  - Cron: lấy giá, tin, lịch   │
                    └───────┬───────────────┬──────┘
                            │               │
                  ┌─────────▼──────┐  ┌─────▼─────────┐
                  │  DATABASE       │  │ NGUỒN NGOÀI    │
                  │  (Postgres/     │  │ - API giá      │
                  │   Supabase/D1)  │  │ - RSS/AI dịch  │
                  │  giá LS, user,  │  │ - Lịch KT      │
                  │  tin, cảnh báo  │  └────────────────┘
                  └─────────────────┘
```

**Gợi ý công nghệ (giữ tinh thần rẻ/free trước):**
- **Frontend:** Next.js hoặc Astro (SEO + tốc độ) — hoặc nâng cấp dần vanilla hiện tại.
- **Backend/Cron:** Cloudflare Workers (free tier rộng) hoặc Node serverless.
- **Database:** Supabase (Postgres, free tier) hoặc Cloudflare D1.
- **Auth:** Supabase Auth / Clerk (có free tier).
- **Host:** Cloudflare Pages (đang dùng — giữ nguyên).
- **CMS:** Decap CMS (Git-based, free) hoặc Sanity/Strapi.

---

## 6. NỘI DUNG & SEO (kênh hút khách miễn phí)

- **Mỗi mặt hàng = 1 trang tối ưu từ khóa:** "giá vàng hôm nay", "giá cà phê
  robusta", "giá đồng LME"... → Google index → traffic tự nhiên.
- **Đăng tin đều đặn** (bot + biên tập) → web "tươi" → Google ưu tiên.
- **Schema markup** (dữ liệu có cấu trúc) cho giá & tin → hiển thị đẹp trên Google.
- **Tốc độ + mobile** (đang tốt nhờ Cloudflare) → giữ thứ hạng.
- **Kênh giữ chân:** Newsletter email, kênh **Zalo OA / Telegram** đẩy tin & cảnh báo.

---

## 7. PHÁP LÝ & TUÂN THỦ (VIỆT NAM)

| Vấn đề | Cần làm |
|---|---|
| **Khuyến nghị đầu tư** | Ghi rõ "chỉ tham khảo, không phải lời khuyên đầu tư" (ĐÃ có) |
| **Bản quyền dữ liệu giá** | Dùng widget (TV tự lo) HOẶC mua feed có license phân phối |
| **Nếu là môi giới** | Tuân thủ quy định MXV & Bộ Công Thương; minh bạch là thành viên nào |
| **Dữ liệu người dùng** | Có tài khoản → cần chính sách bảo mật, lưu trữ an toàn |
| **Quảng cáo tài chính** | Cẩn trọng nội dung "cam kết lợi nhuận" (dễ vi phạm) |
| **Tên miền .vn** | Cần giấy tờ (CCCD/GPKD) khi đăng ký |

---

## 8. MÔ HÌNH DOANH THU

| Cách | Mô tả | Phù hợp mô hình |
|---|---|---|
| **Hoa hồng môi giới** | Khách mở TK giao dịch qua bạn | B |
| **Membership Premium** | Phân tích sâu, cảnh báo, room VIP | C |
| **Khóa học / Đào tạo** | Bán kiến thức giao dịch hàng hóa | C |
| **Quảng cáo / Affiliate** | Banner, bài tài trợ, giới thiệu sàn/sách | A, D |
| **Bản tin trả phí** | Newsletter cao cấp | A, C |

---

## 9. LỘ TRÌNH 5 PHA

| Pha | Nội dung | Trạng thái |
|---|---|---|
| **Pha 0 — MVP** | Bảng giá widget + tin auto + deploy Cloudflare | ✅ **XONG** |
| **Pha 1 — Nội dung & SEO** | Trang chi tiết từng mặt hàng + CMS tin + tối ưu SEO + trang Kiến thức | ⬜ Kế tiếp |
| **Pha 2 — Người dùng** | Tài khoản + watchlist lưu + cảnh báo giá (email/Telegram) | ⬜ |
| **Pha 3 — Chiều sâu** | Phân tích/nhận định + Lịch kinh tế + Bộ công cụ tính toán | ⬜ |
| **Pha 4 — Nâng cấp dữ liệu** | API giá có license → bảng giá tùy biến + lịch sử + realtime | ⬜ |
| **Pha 5 — Kiếm tiền & cộng đồng** | Membership / khóa học / môi giới + Zalo/Telegram + newsletter | ⬜ |

---

## 10. HIỆN TRẠNG vs MỤC TIÊU

| Hạng mục | Đang có (MVP) | Cần thêm để "chuyên nghiệp" |
|---|---|---|
| Giá | Widget ~20 mặt hàng | Trang chi tiết + lịch sử + số liệu MXV |
| Tin | Bot dịch máy | CMS + biên tập + AI dịch/tóm tắt |
| Trang | 4 trang tĩnh | Trang/mặt hàng, phân tích, lịch, học, công cụ |
| Người dùng | Không | Tài khoản, watchlist, cảnh báo |
| Backend | Không (tĩnh) | API + DB + cron |
| SEO | Cơ bản | Trang từ khóa + schema + nội dung đều |
| Doanh thu | Không | Membership/môi giới/quảng cáo |

---

## 11. BỘ CÔNG NGHỆ & CHI PHÍ ĐỀ XUẤT

| Thành phần | Lựa chọn | Chi phí |
|---|---|---|
| Host web | Cloudflare Pages | Free |
| Frontend | Astro / Next.js | Free |
| Backend/Cron | Cloudflare Workers | Free → trả khi scale |
| Database | Supabase / Cloudflare D1 | Free tier rộng |
| Auth | Supabase Auth | Free tier |
| CMS tin | Decap CMS (Git-based) | Free |
| API giá (Pha 4) | Twelve Data / Barchart | ~$30–100/tháng |
| Tên miền | benhanghoa.com.vn | ~350–750k/năm |
| Email/Zalo | Resend / Zalo OA | Free → rẻ |

➡️ **Có thể đi rất xa mà gần như 0đ**, chỉ tốn tiền khi nâng cấp data Pro
hoặc mua tên miền riêng.

---

*Tài liệu này là bản khung. Mỗi pha sẽ có kế hoạch chi tiết riêng khi triển khai.*
