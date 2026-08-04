# ⚓ Bến Hàng Hóa

Trang web tiếng Việt cập nhật **giá hàng hoá thế giới** và **tin tức ảnh hưởng đến giá**,
viết cho nhà đầu tư cá nhân và người mới tìm hiểu hàng hoá phái sinh.

🌐 **https://benhanghoa.com**

| Mục | Giá trị |
|---|---|
| Nền tảng | [Astro](https://astro.build) chế độ `hybrid` |
| Nơi đăng | Cloudflare Pages (tự dựng lại mỗi lần đẩy mã lên) |
| Nội dung | Markdown trong `src/content/` |
| Dữ liệu giá | Biểu đồ nhúng từ TradingView |
| Tin tức | Bot tự lấy RSS + dịch, ghi vào `public/data/news.json` |

---

## ▶️ Chạy trên máy

Cần Node.js 22 trở lên (xem `.nvmrc`).

```bash
npm install            # cài lần đầu
npm run dev            # xem thử — mở http://localhost:4321
npm run build          # dựng bản đăng
npm run preview        # xem thử bản đã dựng
```

Các lệnh phụ:

```bash
npm run check-posts    # kiểm tra bài viết thiếu khai báo đầu bài
npm run fetch-news     # chạy tay bot lấy tin
npm run draft          # chạy tay bot soạn nháp bài phân tích
npm run xem-anh        # liệt kê ảnh bìa, chỉ ra ảnh nào quá nặng
npm run nen-anh        # nén ảnh bìa cho trang nhẹ đi
```

---

## 🧱 Cấu trúc

```
├── src/
│   ├── content/knowledge/   # bài kiến thức
│   ├── content/posts/       # bài phân tích
│   ├── data/commodities.mjs # danh mục mặt hàng + mã TradingView
│   ├── pages/               # các trang
│   ├── layouts/             # khung trang dùng chung
│   └── components/          # khối dùng lại nhiều nơi
├── public/                  # ảnh, CSS, tập tin tĩnh — đưa thẳng lên web
├── functions/api/           # đăng nhập trang quản trị nội dung
├── worker/                  # Worker Cloudflare hẹn giờ gọi bot tin tức
├── scripts/                 # các bot và công cụ chạy bằng Node
├── drafts/                  # bản nháp bot soạn, chờ người duyệt
└── docs/                    # tài liệu định hướng
```

⛔ `dist/` và `.astro/` là **bản dựng tự sinh** — không sửa, sửa xong dựng lại là mất.

---

## 🤖 Ba thứ tự chạy

| Cái gì | Lịch chạy | Việc làm | Tự lên web? |
|---|---|---|---|
| `fetch-news.yml` | phút :25 và :55 mỗi giờ | Lấy tin RSS, dịch, ghi `public/data/news.json` | ✅ có |
| `draft-article.yml` | 08:17 sáng VN (dự phòng 08:47) | Soạn nháp vào `drafts/`, tự xoá nháp cũ hơn 14 ngày | ❌ phải duyệt tay |
| Worker Cloudflare | mỗi đầu giờ | Gọi GitHub kích hoạt bot tin tức cho đúng giờ | — |

Bản nháp trong `drafts/` **không nằm trong `src/content/` nên không tự lên web**.
Muốn đăng: đọc lại, kiểm số liệu, rồi chuyển sang `src/content/posts/`.

---

## ✏️ Sửa gì ở đâu

| Muốn sửa | Sửa tập tin |
|---|---|
| Thêm / bớt mặt hàng | `src/data/commodities.mjs` |
| Mô tả chi tiết mặt hàng | `src/data/details.mjs` |
| Số điện thoại, Zalo, email | `src/data/contact.mjs` |
| Màu sắc, phông chữ | `public/assets/css/style.css` |
| Thêm nguồn tin | mảng `FEEDS` trong `scripts/fetch-news.mjs` |

---

## ⚠️ Lưu ý về nội dung

- Giá từ TradingView **có thể trễ 10–15 phút**, chỉ mang tính tham khảo.
- Mọi số liệu tài chính trong bài phải **ghi rõ nguồn và thời điểm**.
- Nội dung trên trang **không phải lời khuyên đầu tư**.
- Kết quả quá khứ không bảo đảm cho tương lai.

Quy ước viết bài và quy tắc bắt buộc: xem `CLAUDE.md`.
