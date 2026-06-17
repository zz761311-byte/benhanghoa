# 📋 KẾ HOẠCH CHI TIẾT — PHA 1: NỘI DUNG & SEO

> **Định hướng:** Cổng thông tin giá+tin **kết hợp** Môi giới MXV.
> **Mục tiêu Pha 1:** Biến web từ "4 trang tĩnh" thành **cỗ máy hút khách qua
> Google**, đồng thời có **điểm chuyển đổi** khách mở tài khoản giao dịch.

---

## 🎯 KẾT QUẢ MONG ĐỢI SAU PHA 1

1. Mỗi mặt hàng có **1 trang riêng** chuẩn SEO → khách Google "giá cà phê hôm nay" tìm thấy.
2. Mỗi trang mặt hàng có **thông số hợp đồng MXV** + **nút mở tài khoản/tư vấn** → biến khách đọc thành khách hàng.
3. Có **trang Kiến thức** dạy người mới → tăng uy tín + SEO.
4. Có **CMS** để biên tập viên đăng tin/bài không cần đụng code.
5. Web được **Google index** (Search Console + sitemap).

---

## 🧩 CÁC HẠNG MỤC (theo thứ tự triển khai)

### BƯỚC 1 — Hạ tầng SEO nền tảng *(nhanh, làm trước)*
- [ ] Thêm `<title>` + `<meta description>` riêng & chuẩn cho từng trang.
- [ ] Thêm **Open Graph tags** (ảnh + tiêu đề khi share Facebook/Zalo).
- [ ] Tạo `sitemap.xml` + `robots.txt`.
- [ ] Thêm **Schema markup** (structured data) cho tổ chức & bài viết.
- [ ] Kết nối **Google Search Console** + **Google Analytics** (đo lượt xem).

### BƯỚC 2 — Template trang chi tiết mặt hàng ⭐ *(hạng mục lõi)*
Tạo mẫu trang tại đường dẫn đẹp: `/hang-hoa/vang`, `/hang-hoa/ca-phe-arabica`...
Mỗi trang gồm các khối:
- [ ] **Tiêu đề H1 + giá real-time** (widget).
- [ ] **Biểu đồ lớn** (TradingView advanced chart).
- [ ] **Bảng thông số hợp đồng MXV** ⭐ (mã HĐ, đơn vị, độ lớn hợp đồng, bước
      giá, ký quỹ, giờ giao dịch, tháng đáo hạn) — *điểm mạnh cho môi giới.*
- [ ] **Mô tả mặt hàng** (đoạn nội dung tiếng Việt chuẩn SEO: nguồn gốc, yếu tố ảnh hưởng giá).
- [ ] **Tin liên quan** (lọc theo tag mặt hàng).
- [ ] **Khối CTA**: "Mở tài khoản giao dịch [mặt hàng]" + "Nhận tư vấn".
- [ ] **FAQ** (3–5 câu hỏi thường gặp → ăn từ khóa dài).

### BƯỚC 3 — Sinh đủ trang cho ~20 mặt hàng
- [ ] Dùng **1 file dữ liệu** mô tả tất cả mặt hàng (tên, mã, mô tả, thông số HĐ, FAQ).
- [ ] Tự sinh ~20 trang từ template (không viết tay từng trang).

### BƯỚC 4 — Trang Kiến thức / Học
Viết các bài nền tảng (vừa SEO, vừa cho khách mới của môi giới):
- [ ] "Giao dịch hàng hóa phái sinh là gì?"
- [ ] "MXV là gì? Giao dịch qua MXV thế nào?"
- [ ] "Cách đọc bảng giá & biểu đồ"
- [ ] "Ký quỹ, đòn bẩy, đáo hạn — giải thích dễ hiểu"
- [ ] "Thuật ngữ hàng hóa A–Z"

### BƯỚC 5 — CMS tin tức + Lead capture
- [ ] Cài **Decap CMS** (Git-based, free) → biên tập viên đăng tin/bài qua giao diện web.
- [ ] Cấu trúc bài: tiêu đề, ảnh, nội dung, tag mặt hàng, tác giả, ngày.
- [ ] **Form "Mở tài khoản / Tư vấn"** → gửi về email/Zalo của bạn (thu lead).
- [ ] Nhúng CTA tư vấn ở footer + các trang mặt hàng.

---

## ⚙️ QUYẾT ĐỊNH KỸ THUẬT QUAN TRỌNG CẦN CHỐT

### ❶ Cách dựng trang: giữ "thuần" hay nâng lên Astro?
Pha 1 sinh ra **rất nhiều trang** (20 mặt hàng + tin + kiến thức). Có 2 hướng:

| | **Giữ HTML/JS thuần (như hiện tại)** | **Nâng lên Astro (đề xuất)** |
|---|---|---|
| Sinh trang từ dữ liệu | Thủ công / JS render | **Tự động** từ data + markdown |
| SEO | Khá (JS render có hạn chế) | **Tốt nhất** (render sẵn HTML) |
| Quản lý nội dung | Rối khi nhiều trang | **Gọn**, hợp CMS |
| Học/độ phức tạp | Quen rồi | Cần học chút (mình lo phần kỹ thuật) |
| Host Cloudflare | OK | OK (Astro build sẵn) |

➡️ **Khuyến nghị:** nâng lên **Astro** ngay từ Pha 1 (đang nhỏ, chuyển dễ; càng
để lâu càng khó). Mình sẽ giữ nguyên giao diện/logo/màu hiện tại, chỉ đổi "bộ
khung sinh trang" bên dưới.

### ❷ Nguồn thông số hợp đồng MXV
- Cần bảng thông số chuẩn (đơn vị, ký quỹ, giờ GD...) cho từng mặt hàng.
- **Bạn cung cấp** (nếu là member có sẵn) hoặc **mình tổng hợp** từ trang MXV chính thức.

### ❸ Form lead gửi về đâu?
- Email nào? Số Zalo/Telegram nào để nhận yêu cầu tư vấn?

### ❹ CMS: dùng ngay hay sau?
- Cài Decap CMS ngay (biên tập tiện) hay tạm đăng tin thủ công, để CMS bước sau?

---

## 📅 THỨ TỰ MÌNH ĐỀ XUẤT LÀM

1. **Chốt quyết định ❶–❹** ở trên.
2. (Nếu chọn Astro) Dựng lại khung Astro, **bê nguyên giao diện hiện tại** sang.
3. Làm **trang chi tiết mặt hàng** (mẫu 2 món: Vàng + Cà phê) để bạn duyệt.
4. Sinh đủ ~20 trang mặt hàng.
5. Hạ tầng SEO (meta, sitemap, Search Console).
6. Trang Kiến thức (5 bài nền).
7. CMS + form lead.

➡️ Sau mỗi bước có sản phẩm xem được, bạn duyệt rồi mới đi tiếp.

---

## ✅ TIÊU CHÍ HOÀN THÀNH PHA 1
- [ ] ~20 trang mặt hàng live, mỗi trang có giá + chart + thông số MXV + CTA + FAQ.
- [ ] Web có trong Google Search Console, có sitemap, bắt đầu được index.
- [ ] 5 bài Kiến thức nền.
- [ ] Biên tập viên đăng được tin qua CMS.
- [ ] Có form thu lead tư vấn/mở tài khoản.

---

*Khi bạn chốt 4 quyết định kỹ thuật, mình bắt tay triển khai từng bước.*
