// ============================================================
// Bảng giá page — hybrid layout:
// left = clickable list of commodities, right = TradingView Advanced Chart.
// Clicking a row reloads the chart with the selected symbol.
// ============================================================

(function () {
  const listEl = document.getElementById("price-list");
  const chartEl = document.getElementById("tv_chart");
  if (!listEl || !chartEl) return;

  // --- Build the grouped, clickable list ---
  let firstSymbol = null;
  Object.values(window.BHH_SYMBOLS).forEach(group => {
    const title = document.createElement("div");
    title.className = "price-group-title";
    title.textContent = `${group.icon} ${group.label}`;
    listEl.appendChild(title);

    group.items.forEach(item => {
      if (!firstSymbol) firstSymbol = item;
      const row = document.createElement("button");
      row.className = "price-row";
      row.dataset.symbol = item.tv;
      const lim = item.limited
        ? ` <span class="lim-badge" title="Chưa có dữ liệu miễn phí công khai — biểu đồ chỉ hiện khi bạn đăng nhập TradingView">hạn chế</span>`
        : "";
      row.innerHTML = `<span class="nm">${item.name}${lim}</span><span class="unit">${item.unit}</span>`;
      row.addEventListener("click", () => {
        selectRow(row);
        loadChart(item.tv);
      });
      listEl.appendChild(row);
    });
  });

  function selectRow(row) {
    listEl.querySelectorAll(".price-row.active").forEach(r => r.classList.remove("active"));
    row.classList.add("active");
  }

  // --- Load / reload the Advanced Chart widget ---
  function loadChart(symbol) {
    chartEl.innerHTML = "";
    new TradingView.widget({
      autosize: true,
      symbol: symbol,
      interval: "D",
      timezone: "Asia/Ho_Chi_Minh",
      theme: "dark",
      style: "1",
      locale: "vi_VN",
      toolbar_bg: "#0e2138",
      enable_publishing: false,
      hide_side_toolbar: false,
      allow_symbol_change: true,
      container_id: "tv_chart"
    });
  }

  // Auto-select symbol from URL (?symbol=COMEX:GC1!) or default to the first.
  const wanted = new URLSearchParams(location.search).get("symbol");
  const startRow = wanted
    ? listEl.querySelector(`.price-row[data-symbol="${CSS.escape(wanted)}"]`)
    : listEl.querySelector(".price-row");

  if (startRow) {
    selectRow(startRow);
    loadChart(startRow.dataset.symbol);
  } else if (firstSymbol) {
    loadChart(firstSymbol.tv);
  }
})();
