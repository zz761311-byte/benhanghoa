// ============================================================
// Shared header + footer, injected on every page.
// Set <body data-page="home|prices|news|about"> to highlight the active link.
// ============================================================

(function () {
  const page = document.body.getAttribute("data-page") || "";

  const links = [
    { key: "home",   href: "index.html",    label: "Trang chủ" },
    { key: "prices", href: "bang-gia.html", label: "Bảng giá" },
    { key: "news",   href: "tin-tuc.html",  label: "Tin tức" },
    { key: "about",  href: "gioi-thieu.html", label: "Giới thiệu" }
  ];

  const navLinks = links
    .map(l => `<a href="${l.href}" class="${l.key === page ? "active" : ""}">${l.label}</a>`)
    .join("");

  const header = `
  <header class="site-header">
    <div class="container nav">
      <a class="brand" href="index.html">
        <img class="logo-img" src="assets/img/logo-icon.png" alt="Bến Hàng Hóa"
             onerror="this.onerror=null;this.src='assets/img/favicon.svg'">
        <span>BẾN <b>HÀNG HÓA</b></span>
      </a>
      <button class="nav-toggle" aria-label="Menu">☰</button>
      <nav class="nav-links">${navLinks}</nav>
    </div>
  </header>`;

  const year = "2026"; // static to keep build deterministic
  const footer = `
  <footer class="site-footer">
    <div class="container">
      <div>
        <span style="display:inline-flex;align-items:center;gap:8px">
          <img src="assets/img/logo-icon.png" alt="" style="width:24px;height:24px;border-radius:50%;background:#2e5a3c"
               onerror="this.style.display='none'">
          <strong style="color:var(--text)">Bến Hàng Hóa</strong>
        </span> — Giá hàng hóa & tin tức cho người Việt.<br>
        Dữ liệu giá từ TradingView (có thể trễ 10–15 phút). Chỉ mang tính tham khảo.
      </div>
      <div>
        © ${year} Bến Hàng Hóa ·
        <a href="bang-gia.html">Bảng giá</a> ·
        <a href="tin-tuc.html">Tin tức</a>
      </div>
    </div>
  </footer>`;

  // Inject favicon (SVG) into <head>.
  const fav = document.createElement("link");
  fav.rel = "icon";
  fav.type = "image/svg+xml";
  fav.href = "assets/img/favicon.svg";
  document.head.appendChild(fav);

  // Inject header at the very top, footer at the very bottom.
  document.body.insertAdjacentHTML("afterbegin", header);
  document.body.insertAdjacentHTML("beforeend", footer);

  // Mobile menu toggle.
  const toggle = document.querySelector(".nav-toggle");
  const menu = document.querySelector(".nav-links");
  if (toggle && menu) {
    toggle.addEventListener("click", () => menu.classList.toggle("open"));
  }
})();
