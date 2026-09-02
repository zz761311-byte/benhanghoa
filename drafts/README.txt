THƯ MỤC BẢN NHÁP (drafts)
=========================

Nơi bot tự để bản nháp bài phân tích mỗi sáng. Mỗi ngày 2–3 bản cho cùng một
chủ đề, mỗi AI viết một bản:

   2026-09-02-dau-tho-....gemini.md       ← bản do Gemini viết
   2026-09-02-dau-tho-....groq.md         ← bản do Groq viết
   2026-09-02-dau-tho-....openrouter.md   ← bản do OpenRouter viết

Bên trong mỗi tập tin có sẵn cả 4 caption Fanpage, nằm ở ô "captions" của phần
khai báo đầu bài.

QUAN TRỌNG
----------
- Tập tin ở đây KHÔNG hiển thị trên web (vì không nằm trong src/content/posts/).
- Bản nháp cũ hơn 14 ngày TỰ BỊ XOÁ mỗi lượt bot chạy. Bài nào muốn giữ thì
  chuyển sang src/content/posts/ trước khi quá hạn.
- Không bao giờ đăng thẳng bài bot viết mà chưa đọc lại và chưa kiểm số liệu.

CÁCH DUYỆT VÀ ĐĂNG — dùng trang quản trị (nhanh nhất, từ 02/09/2026)
--------------------------------------------------------------------
1. Mở https://benhanghoa.com/admin — đăng nhập bằng GitHub.
2. Bấm mục "Bản nháp AI (chưa lên web)" ở cột trái, chọn bài muốn xem.
3. Đọc lại, sửa lời văn, điền mốc giá thật.
4. Copy phần nội dung sang mục "Tin tức / Bài viết" (bấm "New"), điền tiêu đề,
   nhóm hàng, ảnh, tóm tắt rồi bấm lưu — bài lên web sau vài phút.
5. Caption Fanpage nằm ở ô riêng "Caption Fanpage" — copy thẳng sang Facebook,
   ĐỪNG dán vào phần nội dung bài.
6. Xoá khối cảnh báo "> ⚠️ BẢN NHÁP..." ở đầu bài trước khi đăng.

CÁCH KHÁC — nhờ Claude Code
---------------------------
Mở Claude Code, nói "xem bài nháp hôm nay". Claude đọc các bản, bạn chọn bản hay
hơn, nói "kết nối tv" để Claude điền mốc giá thật, rồi Claude chuyển bài sang
src/content/posts/ và đẩy lên web.

Vì sao tập tin này đuôi .txt chứ không phải .md
-----------------------------------------------
Trang quản trị đọc mọi tập tin .md trong thư mục này thành một bản nháp. Tập tin
hướng dẫn không có phần khai báo đầu bài nên sẽ hiện thành một mục lỗi trong
danh sách. Đổi sang .txt là nó đứng ngoài, không làm rối danh sách nháp.
