# Worker hẹn giờ tin tức — Bến Hàng Hóa

Worker nhỏ chạy trên **Cloudflare Cron** (đúng giờ, đáng tin cậy). Đúng giờ nó
gọi GitHub kích hoạt bot `fetch-news.yml` để lấy + dịch tin và cập nhật
`public/data/news.json`. Web vẫn đọc tin như cũ — **không đổi gì**.

```
Cloudflare Worker (cron)  ──►  GitHub Actions (bot)  ──►  news.json  ──►  Web
```

## Cần gì
- 1 **GitHub fine-grained PAT**, quyền **Actions: Read and write** trên repo
  `benhanghoa`. Lưu vào Worker dưới tên secret **`GH_TOKEN`**.

## Triển khai bằng wrangler (khuyên dùng)

```bash
cd worker
npm install
npx wrangler login                 # mở trình duyệt → bấm Allow
npx wrangler deploy                # đẩy Worker + cron lên Cloudflare
npx wrangler secret put GH_TOKEN   # dán PAT khi được hỏi
```

## Hoặc triển khai bằng Dashboard
1. Cloudflare → **Workers & Pages** → **Create** → **Create Worker**.
2. Đặt tên `benhanghoa-news-cron` → Deploy → **Edit code** → dán nội dung
   `src/worker.mjs` → **Deploy**.
3. **Settings → Triggers → Cron Triggers → Add** → `0 * * * *`.
4. **Settings → Variables and Secrets → Add → Secret** → tên `GH_TOKEN`,
   giá trị = PAT → Save.

## Kiểm tra
Mở URL của Worker trên trình duyệt (vd `https://benhanghoa-news-cron.<tài-khoản>.workers.dev`).
Thấy "✅ Đã kích hoạt bot..." → vào **GitHub → Actions** sẽ thấy 1 lần chạy mới.
