// ============================================================
// Decap CMS — đăng nhập GitHub (bước 1): chuyển hướng tới GitHub xin quyền.
// Chạy như Cloudflare Pages Function tại đường dẫn /api/auth
// Cần biến môi trường: GITHUB_OAUTH_CLIENT_ID
// ============================================================
export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);

  const clientId = env.GITHUB_OAUTH_CLIENT_ID;
  if (!clientId) {
    return new Response("Thiếu GITHUB_OAUTH_CLIENT_ID trong cấu hình môi trường.", { status: 500 });
  }

  const scope = url.searchParams.get("scope") || "repo";
  const redirectUri = `${url.origin}/api/callback`;

  const authorize = new URL("https://github.com/login/oauth/authorize");
  authorize.searchParams.set("client_id", clientId);
  authorize.searchParams.set("redirect_uri", redirectUri);
  authorize.searchParams.set("scope", scope);
  authorize.searchParams.set("allow_signup", "false");

  return Response.redirect(authorize.toString(), 302);
}
