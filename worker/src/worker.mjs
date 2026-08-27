// ============================================================
// Bến Hàng Hóa — Worker hẹn giờ (Cloudflare Cron)
// ------------------------------------------------------------
// Vai trò: làm "đồng hồ đáng tin cậy". Đúng đầu mỗi giờ → gọi GitHub API
// kích hoạt các bot cập nhật nội dung:
//   • fetch-news.yml    — lấy + dịch tin, ghi public/data/news.json
//   • fetch-prices.yml  — lấy giá 18 mặt hàng, ghi public/data/gia.json
//
// 🔴 VÌ SAO CẦN WORKER NÀY — bẫy đã mắc ngày 27/08/2026:
// Lịch `schedule` của GitHub KHÔNG đáng tin. Hôm ấy GitHub gặp sự cố tính phí
// ("Disruption with GitHub Billing", mở lúc 23:37 UTC ngày 26/08) và mọi lượt
// chạy theo lịch của kho này ngừng hẳn. Bot giá đứng im suốt 8 tiếng — 0 lượt,
// trong khi ngày thường chạy 17–23 lượt. Bot tin tức KHÔNG chết theo, vì Worker
// này gọi nó bằng `workflow_dispatch` — kiểu gọi tay vẫn chạy bình thường.
//
// Bài học: bot không được kích hoạt thì KHÔNG có lượt chạy nào để báo đỏ —
// im lặng tuyệt đối, kiểu hỏng nguy hiểm nhất. Nên mọi bot cập nhật nội dung
// đều phải có Worker này gọi, coi như lớp bảo hiểm thứ hai cho lịch GitHub.
//
// Vì sao KHÔNG tự lấy tin/giá ngay trong Worker?
//  - Bot trên GitHub đang chạy tốt; địa chỉ mạng của Cloudflare có thể bị các
//    nguồn dữ liệu chặn.
//  - Worker chỉ làm "bấm nút đúng giờ" → đơn giản, ít rủi ro, web không đổi gì.
//
// Cần 1 khoá bí mật:  GH_TOKEN = GitHub fine-grained PAT, quyền
//                     Actions: Read and write trên kho benhanghoa.
// ============================================================

const OWNER = "zz761311-byte";
const REPO = "benhanghoa";
const BRANCH = "main";

// Danh sách bot cần gọi. `khiNao` quyết định giờ nào thì gọi bot đó — trả về
// true là gọi. Tham số là thời điểm hiện tại theo giờ UTC.
const CAC_BOT = [
  {
    tapTin: "fetch-news.yml",
    ten: "bot tin tức",
    // Tin tức chạy quanh năm suốt tháng, không phụ thuộc giờ mở cửa sàn
    khiNao: () => true,
  },
  {
    tapTin: "fetch-prices.yml",
    ten: "bot giá",
    // Chỉ gọi lúc sàn CME/ICE còn giao dịch: thứ Hai đến thứ Sáu (giờ UTC),
    // cộng tối Chủ nhật là lúc sàn mở lại tuần mới. Thứ Bảy sàn đóng cả ngày
    // nên gọi cũng chỉ tốn lượt chạy mà giá y hệt.
    khiNao: (bayGio) => {
      const thu = bayGio.getUTCDay();   // 0 = Chủ nhật
      const gio = bayGio.getUTCHours();
      return (thu >= 1 && thu <= 5) || (thu === 0 && gio >= 22);
    },
  },
];

// Gọi GitHub kích hoạt một workflow. GitHub trả 204 là thành công.
async function goiMotBot(env, tapTin) {
  const phanHoi = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/${tapTin}/dispatches`,
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
  const xong = phanHoi.status === 204;
  return { xong, ma: phanHoi.status, loi: xong ? "" : await phanHoi.text() };
}

// Gọi các bot đến lượt. `boQuaLich` = true thì gọi hết, không xét giờ giấc
// (dùng khi người vận hành tự bấm tay, vì bấm tay là đã cố ý).
async function goiCacBot(env, boQuaLich = false) {
  const bayGio = new Date();
  const ketQua = [];
  for (const bot of CAC_BOT) {
    if (!boQuaLich && !bot.khiNao(bayGio)) {
      ketQua.push({ ten: bot.ten, boQua: true });
      continue;
    }
    try {
      ketQua.push({ ten: bot.ten, ...(await goiMotBot(env, bot.tapTin)) });
    } catch (loi) {
      ketQua.push({ ten: bot.ten, xong: false, ma: 0, loi: String(loi) });
    }
  }
  return ketQua;
}

export default {
  // Chạy tự động theo lịch Cron (đặt ở wrangler.toml / trang quản trị Cloudflare)
  async scheduled(event, env, ctx) {
    ctx.waitUntil(goiCacBot(env));
  },

  // Mở địa chỉ của Worker trên trình duyệt để BẤM TAY kiểm tra ngay
  async fetch(req, env) {
    if (!env.GH_TOKEN) {
      return new Response("❌ Thiếu GH_TOKEN — chưa cấu hình khoá bí mật.", {
        status: 500,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }
    const ketQua = await goiCacBot(env, true);   // bấm tay thì gọi hết
    const dong = ketQua.map((r) =>
      r.boQua ? `⏭️ ${r.ten}: bỏ qua (ngoài giờ giao dịch)` :
      r.xong ? `✅ ${r.ten}: đã kích hoạt` :
      `❌ ${r.ten}: lỗi ${r.ma} ${r.loi}`
    );
    const tatCaXong = ketQua.every((r) => r.xong || r.boQua);
    return new Response(
      dong.join("\n") + "\n\nVào GitHub → tab Actions xem sau khoảng 1 phút.",
      {
        status: tatCaXong ? 200 : 502,
        headers: { "content-type": "text/plain; charset=utf-8" },
      }
    );
  },
};
