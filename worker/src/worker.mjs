// ============================================================
// Bến Hàng Hóa — Worker hẹn giờ tin tức (Cloudflare Cron)
// ------------------------------------------------------------
// Vai trò: làm "đồng hồ đáng tin cậy". Đúng giờ → gọi GitHub API
// kích hoạt workflow "fetch-news.yml" để bot lấy + dịch tin và
// cập nhật public/data/news.json.
//
// Vì sao KHÔNG tự lấy tin ngay trong Worker?
//  - Bot trên GitHub đang chạy tốt (Google Translate hoạt động ổn
//    từ IP của GitHub). IP của Cloudflare có thể bị Google chặn.
//  - Worker chỉ làm "bấm nút đúng giờ" → đơn giản, ít rủi ro,
//    web không phải đổi gì.
//
// Cron của Cloudflare bắn ĐÚNG GIỜ (không bị bỏ qua như lịch GitHub
// lúc cao điểm) → tin cập nhật đều đặn.
//
// Cần 1 secret:  GH_TOKEN  = GitHub fine-grained PAT, quyền
//                Actions: Read and write trên repo benhanghoa.
// ============================================================

const OWNER = "zz761311-byte";
const REPO = "benhanghoa";
const WORKFLOW = "fetch-news.yml";
const BRANCH = "main";

// Gọi GitHub kích hoạt workflow. Trả 204 = thành công.
async function trigger(env) {
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/${WORKFLOW}/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GH_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "benhanghoa-cron-worker",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ref: BRANCH }),
    }
  );
  const ok = res.status === 204;
  return { ok, status: res.status, text: ok ? "" : await res.text() };
}

export default {
  // Chạy tự động theo lịch Cron (đặt ở wrangler.toml / dashboard)
  async scheduled(event, env, ctx) {
    ctx.waitUntil(trigger(env));
  },

  // Mở URL của Worker trên trình duyệt để BẤM TAY kiểm tra ngay
  async fetch(req, env) {
    if (!env.GH_TOKEN) {
      return new Response("❌ Thiếu GH_TOKEN — chưa cấu hình secret.", {
        status: 500,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }
    const r = await trigger(env);
    return new Response(
      r.ok
        ? "✅ Đã kích hoạt bot lấy tin trên GitHub. Vào tab Actions xem sau ~1 phút."
        : `❌ Lỗi ${r.status}: ${r.text}`,
      {
        status: r.ok ? 200 : 502,
        headers: { "content-type": "text/plain; charset=utf-8" },
      }
    );
  },
};
