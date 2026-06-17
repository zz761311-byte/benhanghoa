// ============================================================
// Decap CMS — đăng nhập GitHub (bước 2): nhận "code", đổi lấy access_token,
// rồi gửi token về cửa sổ Decap qua postMessage (đúng giao thức Decap/Netlify CMS).
// Chạy như Cloudflare Pages Function tại đường dẫn /api/callback
// Cần biến môi trường: GITHUB_OAUTH_CLIENT_ID, GITHUB_OAUTH_CLIENT_SECRET
// ============================================================
export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return htmlResponse(renderMessage("error", { error: "Thiếu mã code từ GitHub." }));
  }
  if (!env.GITHUB_OAUTH_CLIENT_ID || !env.GITHUB_OAUTH_CLIENT_SECRET) {
    return htmlResponse(renderMessage("error", { error: "Thiếu Client ID/Secret trong môi trường." }));
  }

  let payload, status;
  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "BenHangHoa-CMS"
      },
      body: JSON.stringify({
        client_id: env.GITHUB_OAUTH_CLIENT_ID,
        client_secret: env.GITHUB_OAUTH_CLIENT_SECRET,
        code
      })
    });
    const data = await tokenRes.json();
    if (data.access_token) {
      status = "success";
      payload = { token: data.access_token, provider: "github" };
    } else {
      status = "error";
      payload = { error: data.error_description || data.error || "Không lấy được token." };
    }
  } catch (e) {
    status = "error";
    payload = { error: "Lỗi kết nối GitHub: " + e.message };
  }

  return htmlResponse(renderMessage(status, payload));
}

function htmlResponse(html) {
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
}

// Trang HTML thực hiện handshake postMessage với cửa sổ Decap CMS
function renderMessage(status, payload) {
  const data = JSON.stringify(payload);
  return `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><title>Đang xác thực…</title></head>
<body>
<p style="font-family:sans-serif">Đang xác thực, vui lòng đợi…</p>
<script>
  (function() {
    function receiveMessage(e) {
      window.opener.postMessage(
        'authorization:github:${status}:${data}',
        e.origin
      );
      window.removeEventListener('message', receiveMessage, false);
    }
    window.addEventListener('message', receiveMessage, false);
    window.opener.postMessage('authorizing:github', '*');
  })();
</script>
</body></html>`;
}
