# ⚓ Bến Hàng Hóa

Trang web tiếng Việt cập nhật **giá hàng hóa thế giới** và **tin tức** ảnh hưởng đến giá.
Giai đoạn hiện tại: **khung chạy được, miễn phí 100%**.

---

## 🧱 Cấu trúc dự án

```
Bến Hàng Hóa/
├── index.html            # Trang chủ (ticker giá + hàng hóa nổi bật + tin mới)
├── bang-gia.html         # Bảng giá: danh sách bên trái + biểu đồ bên phải
├── tin-tuc.html          # Tin tức (đọc từ data/news.json)
├── gioi-thieu.html       # Giới thiệu
├── assets/
│   ├── css/style.css     # Giao diện nền tối (xanh biển + vàng ánh kim)
│   └── js/
│       ├── symbols.js    # Danh mục mặt hàng + mã TradingView  ← chỉnh ở đây
│       ├── components.js # Header/Footer dùng chung
│       ├── home.js, prices.js, news.js
├── data/news.json        # Tin đã dịch (bot tự ghi đè)
├── scripts/fetch-news.mjs# Bot lấy RSS + dịch sang tiếng Việt
└── .github/workflows/fetch-news.yml  # Hẹn giờ chạy bot (mỗi giờ)
```

---

## ▶️ Xem thử trên máy (không cần cài gì)

Mở thẳng `index.html` bằng trình duyệt là xem được phần **giá** (widget TradingView).
Phần **tin tức** đọc file `data/news.json` qua `fetch()` nên cần một máy chủ tĩnh nhỏ:

```bash
# Cách 1: dùng Python (có sẵn trên hầu hết máy)
python -m http.server 8080
# rồi mở http://localhost:8080

# Cách 2: dùng Node
npx serve .
```

---

## 🤖 Cập nhật tin tức

Chạy tay để thử:

```bash
node scripts/fetch-news.mjs
```

Bot sẽ lấy tin từ các nguồn RSS miễn phí (OilPrice, Mining.com, Investing...),
dịch tiêu đề + tóm tắt sang tiếng Việt, gắn nhãn nhóm hàng, rồi ghi vào `data/news.json`.

> ⚠️ Bản dịch dùng endpoint dịch **miễn phí, không chính thức** — phù hợp cho khung.
> Khi cần ổn định/chất lượng cao, đổi hàm `translate()` sang API dịch chính thức
> hoặc dùng AI dịch + tóm tắt.

Khi đưa lên GitHub, file `.github/workflows/fetch-news.yml` sẽ **tự chạy mỗi giờ**.

---

## 🌐 Đưa web lên mạng miễn phí

1. Tạo repo trên GitHub, đẩy toàn bộ thư mục này lên.
2. Vào **Cloudflare Pages** (hoặc Netlify) → kết nối repo → deploy.
   - Không cần build command. Thư mục xuất bản: thư mục gốc.
3. Có ngay địa chỉ miễn phí dạng `benhanghoa.pages.dev`.
4. Khi muốn dùng tên miền riêng `benhanghoa.com.vn` (có phí ~350–750k/năm),
   mua tại nhà đăng ký VN rồi trỏ về Cloudflare Pages.

---

## ✏️ Tùy chỉnh nhanh

- **Thêm/bớt mặt hàng:** sửa `assets/js/symbols.js`.
- **Sửa mã giá bị trống** (LME, quặng sắt, cao su): đổi `tv:` cho khớp mã TradingView.
- **Đổi màu thương hiệu:** sửa các biến `--accent`, `--accent-2` ở đầu `assets/css/style.css`.
- **Thêm nguồn tin:** sửa mảng `FEEDS` trong `scripts/fetch-news.mjs`.

---

## ⚠️ Lưu ý

- Giá từ TradingView **có thể trễ 10–15 phút**, chỉ mang tính **tham khảo**.
- Một vài mã kim loại LME / quặng sắt / cao su có thể cần chỉnh lại cho khớp dữ liệu free.
- Trang không phải lời khuyên đầu tư.
