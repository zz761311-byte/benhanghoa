# Worker hẹn giờ — Bến Hàng Hóa

Worker nhỏ chạy trên **Cloudflare Cron** (đúng giờ, đáng tin cậy). Đầu mỗi giờ
nó gọi GitHub kích hoạt hai bot:

| Bot | Ghi ra | Gọi lúc nào |
|---|---|---|
| `fetch-news.yml` | `public/data/news.json` | mọi giờ, mọi ngày |
| `fetch-prices.yml` | `public/data/gia.json` | T2–T6 (giờ UTC) + tối Chủ nhật từ 22h — lúc sàn còn giao dịch |

Web vẫn đọc như cũ — **không đổi gì**.

```
Cloudflare Worker (cron)  ──►  GitHub Actions (bot)  ──►  news.json + gia.json  ──►  Web
```

## 🔴 Vì sao cần Worker này

Lịch `schedule` của GitHub **không đáng tin**. Ngày 27/08/2026 GitHub gặp sự cố
tính phí (*"Disruption with GitHub Billing"*, mở lúc 23:37 UTC ngày 26/08) và mọi
lượt chạy theo lịch của kho này ngừng hẳn:

| | Ngày thường | Ngày 27/08 |
|---|---|---|
| Bot giá (chỉ có lịch GitHub) | 17–23 lượt/ngày | **0 lượt**, đứng im 8 tiếng |
| Bot tin tức (có Worker gọi) | 24 lượt/ngày | vẫn 24 lượt, chạy đều |

Kiểu gọi của Worker (`workflow_dispatch`) vẫn chạy bình thường trong khi lịch
`schedule` chết. Vì vậy **mọi bot cập nhật nội dung đều phải có Worker gọi** —
coi như lớp bảo hiểm thứ hai. Lịch trong tập tin `.yml` vẫn giữ nguyên, hai lớp
cùng chạy thì bot chỉ tốn thêm một lượt, còn thiếu một lớp là có ngày web đứng im.

⚠️ Bot không được kích hoạt thì **không có lượt chạy nào để báo đỏ** — mọi cảnh
báo "hỏng phải kêu" trong mã bot đều vô dụng ở tình huống này.

## Cần gì
- 1 **GitHub fine-grained PAT**, quyền **Actions: Read and write** trên repo
  `benhanghoa`. Lưu vào Worker dưới tên secret **`GH_TOKEN`**.

## Nạp lên bằng wrangler (khuyên dùng)

```bash
cd worker
npm install
npx wrangler login                 # mở trình duyệt → bấm Allow
npx wrangler deploy                # đẩy Worker + cron lên Cloudflare
npx wrangler secret put GH_TOKEN   # dán PAT khi được hỏi
```

⚠️ **Không đổi dòng `name` trong `wrangler.toml`** (`benhanghoa-news-cron`).
Đổi tên là Cloudflare tạo ra một Worker MỚI — bản cũ vẫn chạy song song, còn bản
mới thì chưa có lịch cron lẫn khoá `GH_TOKEN`. Tên nghe như chỉ dành cho tin tức,
nhưng nay Worker gọi cả bot giá; giữ nguyên tên vẫn hơn là đổi rồi hỏng.

**Nạp lại bản mới không cần đặt lại `GH_TOKEN`** — khoá bí mật và lịch cron nằm
lại trên Cloudflare, `wrangler deploy` chỉ thay phần mã.

## Hoặc triển khai bằng Dashboard
1. Cloudflare → **Workers & Pages** → **Create** → **Create Worker**.
2. Đặt tên `benhanghoa-news-cron` → Deploy → **Edit code** → dán nội dung
   `src/worker.mjs` → **Deploy**.
3. **Settings → Triggers → Cron Triggers → Add** → `0 * * * *`.
4. **Settings → Variables and Secrets → Add → Secret** → tên `GH_TOKEN`,
   giá trị = PAT → Save.

## Kiểm tra
Mở địa chỉ của Worker trên trình duyệt (vd `https://benhanghoa-news-cron.<tài-khoản>.workers.dev`).
Bấm tay thì Worker gọi **cả hai bot**, bất kể giờ giấc, và hiện kết quả từng bot:

```
✅ bot tin tức: đã kích hoạt
✅ bot giá: đã kích hoạt
```

Vào **GitHub → Actions** sau khoảng 1 phút sẽ thấy hai lượt chạy mới.
