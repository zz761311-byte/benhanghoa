// ============================================================
// Trang chủ — render the top ticker tape + featured "mini symbol" cards
// + latest news preview (read from data/news.json).
// ============================================================

(function () {
  // --- Top scrolling ticker tape ---
  const tickerHost = document.getElementById("ticker");
  if (tickerHost) {
    const cfg = {
      symbols: window.BHH_TICKER,
      showSymbolLogo: true,
      isTransparent: true,
      displayMode: "adaptive",
      colorTheme: "dark",
      locale: "vi_VN"
    };
    const s = document.createElement("script");
    s.type = "text/javascript";
    s.async = true;
    s.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    s.innerHTML = JSON.stringify(cfg);
    tickerHost.appendChild(s);
  }

  // --- Featured mini charts (one per highlighted commodity) ---
  const featured = [
    "TVC:GOLD", "TVC:USOIL", "OANDA:XCUUSD", "CAPITALCOM:SOYBEAN",
    "CAPITALCOM:COFFEE", "CAPITALCOM:NATURALGAS", "TVC:SILVER", "CAPITALCOM:CORN"
  ];
  const grid = document.getElementById("featured-grid");
  if (grid) {
    featured.forEach(sym => {
      const card = document.createElement("div");
      card.className = "card mini-quote";
      const wrap = document.createElement("div");
      wrap.className = "tradingview-widget-container";
      card.appendChild(wrap);
      grid.appendChild(card);

      const cfg = {
        symbol: sym,
        width: "100%",
        height: "100%",
        locale: "vi_VN",
        dateRange: "1M",
        colorTheme: "dark",
        isTransparent: true,
        autosize: true,
        chartOnly: false,
        noTimeScale: false
      };
      const s = document.createElement("script");
      s.type = "text/javascript";
      s.async = true;
      s.src = "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
      s.innerHTML = JSON.stringify(cfg);
      wrap.appendChild(s);
    });
  }

  // --- Latest news preview ---
  const newsHost = document.getElementById("home-news");
  if (newsHost) {
    fetch("data/news.json", { cache: "no-store" })
      .then(r => r.json())
      .then(data => renderHomeNews(newsHost, (data.items || []).slice(0, 4)))
      .catch(() => {
        newsHost.innerHTML = `<div class="empty-note">Chưa tải được tin. Bot tin tức sẽ tự cập nhật <code>data/news.json</code>.</div>`;
      });
  }

  function renderHomeNews(host, items) {
    if (!items.length) {
      host.innerHTML = `<div class="empty-note">Chưa có tin. Hãy chạy bot lấy tin để cập nhật.</div>`;
      return;
    }
    host.innerHTML = items.map(n => `
      <div class="news-item">
        <h3><a href="${n.link}" target="_blank" rel="noopener">${n.title_vi || n.title}</a></h3>
        <div class="news-meta"><span class="tag ${n.category || ""}">${n.category_vi || "Hàng hóa"}</span><span>${n.source || ""}</span></div>
      </div>`).join("");
  }
})();
