# 📷 Kho ảnh minh họa cho bài viết & Fanpage

Thư mục này chứa **ảnh minh họa** cho từng nhóm/mặt hàng. Khi bot soạn nháp bài
phân tích, nó **tự gắn ảnh phù hợp** vào bài web và ghi tên ảnh đó trong file
caption Fanpage (`.fanpage.txt`) để bạn đính kèm khi đăng.

> ⚠️ Ảnh dùng cho BÀI CẦN ĐỒ THỊ thì bạn **tự vẽ trên TradingView rồi upload**,
> không lấy từ kho này.

---

## 🧠 Quy tắc bot tự chọn ảnh

Bot ưu tiên theo thứ tự:

1. **Ảnh riêng mặt hàng** (vd `vang.jpg`, `dau-tho.jpg`) — nếu có.
2. Không có → **ảnh theo nhóm** (vd `kim-loai.jpg`).
3. Không có cả hai → dùng ảnh từ bản tin gốc.

→ Bạn **chỉ cần bỏ file ảnh vào đây, đặt đúng tên** là code tự nhận. Không phải sửa code.

### 🎲 Nhiều ảnh 1 loại → bot tự đổi ảnh cho đa dạng

Muốn mỗi bài 1 ảnh khác nhau? Bỏ **nhiều ảnh** cùng loại bằng **hậu tố số**:

```
kim-loai-1.jpg  kim-loai-2.jpg  kim-loai-3.jpg  kim-loai-4.jpg  kim-loai-5.jpg
```

Bot sẽ **bốc ngẫu nhiên 1 ảnh** mỗi lần soạn bài. Đặt được `-1` đến `-9`. Cũng chấp
nhận tên trơn `kim-loai.jpg`. (Áp dụng cho cả ảnh nhóm lẫn ảnh riêng mặt hàng.)

---

## ✅ CẦN NGAY — 5 ảnh theo nhóm (đủ để chạy)

| Tên file | Dùng cho nhóm | Gợi ý ảnh |
|---|---|---|
| `nang-luong.jpg` | Năng lượng | giàn khoan dầu, bồn chứa, đường ống |
| `kim-loai.jpg` | Kim loại | thỏi kim loại, mỏ khai thác |
| `nong-san.jpg` | Nông sản | cánh đồng lúa mì/ngô, hạt ngũ cốc |
| `nguyen-lieu.jpg` | Nguyên liệu | hạt cà phê, bao tải nông sản |
| `vi-mo.jpg` | Vĩ mô | bảng điện chứng khoán, tòa nhà Fed, USD |

## ➕ TÙY CHỌN — ảnh riêng từng mặt hàng (thêm dần để bài sinh động hơn)

`vang.jpg` (vàng) · `bac.jpg` (bạc) · `dong.jpg` (đồng) · `bach-kim.jpg` (bạch kim) ·
`nhom.jpg` (nhôm) · `nickel.jpg` · `thep-quang-sat.jpg` (thép/quặng sắt) ·
`dau-tho.jpg` (dầu thô) · `khi-dot.jpg` (khí đốt) ·
`ca-phe.jpg` · `duong.jpg` · `ca-cao.jpg` · `bong.jpg` · `cao-su.jpg` ·
`ngo.jpg` · `dau-tuong.jpg` · `lua-mi.jpg`

---

## 📐 Yêu cầu kỹ thuật ảnh

- **Kích thước:** ~**1200 × 630 px** (tỉ lệ ngang, chuẩn Facebook).
- **Định dạng:** `.jpg` (hoặc `.png` / `.webp` — code nhận cả 3).
- **Dung lượng:** dưới ~300 KB (ảnh nhẹ, web tải nhanh).

## 🆓 Tải ảnh miễn phí ở đâu (không lo bản quyền)

- **unsplash.com** · **pexels.com** · **pixabay.com**
- Gõ từ khóa **tiếng Anh** cho ra nhiều ảnh đẹp:
  - Dầu: `oil rig`, `oil barrels`, `refinery`
  - Vàng/bạc/đồng: `gold bars`, `silver bars`, `copper wire`
  - Cà phê: `coffee beans`, `coffee plantation`
  - Nông sản: `wheat field`, `corn field`, `soybean`
  - Vĩ mô: `stock market`, `federal reserve`, `us dollar`

## ⬆️ Cách thêm ảnh

**Cách 1 — trên GitHub (dễ nhất):**
1. Vào repo → thư mục `public/assets/fanpage/`.
2. **Add file → Upload files** → kéo ảnh vào.
3. **Đổi tên ảnh đúng theo bảng trên** (vd `kim-loai.jpg`).
4. **Commit changes**.

**Cách 2 — trên máy:** copy ảnh vào thư mục này rồi `git push`.

→ Sau khi thêm, lần soạn nháp tiếp theo bot sẽ tự dùng ảnh của bạn.
