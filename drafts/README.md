# 📝 Thư mục BẢN NHÁP (drafts)

Đây là nơi **trợ lý AI tự để bản nháp bài phân tích** mỗi sáng (08:07 giờ VN).

## Quan trọng
- File trong thư mục này **KHÔNG hiển thị trên web** (vì không nằm trong `src/content/posts/`).
- Mỗi sáng bot tạo, ví dụ, 2 bản cho cùng 1 tin:
  - `2026-06-18-dau-wti....gemini.md`  ← bản do Gemini viết
  - `2026-06-18-dau-wti....groq.md`    ← bản do Groq viết
  - kèm `.fanpage.txt` ← 4 caption để đăng Fanpage (đăng tay).

## Cách duyệt & ĐĂNG một bài (làm cùng Claude Code cho nhanh)
1. Mở Claude Code, nói: **"xem bài nháp hôm nay"**.
2. Claude đọc 2 bản, bạn chọn bản hay hơn.
3. (Nên) nói **"kết nối tv"** để Claude điền **mốc giá thật** vào phần kỹ thuật.
4. Claude **xóa dòng cảnh báo nháp**, chuyển file vào `src/content/posts/`, build, đẩy lên web.
5. Mở file `.fanpage.txt`, copy caption đăng lên Fanpage.

## Làm thủ công (không cần Claude)
- Sửa nội dung + điền mốc giá trong file `.md`.
- **Xóa khối cảnh báo** `> ⚠️ BẢN NHÁP...` ở đầu.
- Chuyển (di chuyển) file `.md` sang `src/content/posts/` → commit → web tự cập nhật.

> 🗑️ Bản nháp không dùng cứ để đó hoặc xóa — không ảnh hưởng web.
