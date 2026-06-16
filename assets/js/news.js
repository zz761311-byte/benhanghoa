// ============================================================
// Trang Tin tức — read data/news.json and render the list, with
// category filtering. The JSON is produced by scripts/fetch-news.mjs.
// ============================================================

(function () {
  const listEl = document.getElementById("news-list");
  const filterEl = document.getElementById("news-filter");
  const updatedEl = document.getElementById("news-updated");
  if (!listEl) return;

  const CAT_LABEL = {
    metal: "Kim loại", energy: "Năng lượng",
    agri: "Nông sản", soft: "Nguyên liệu", macro: "Vĩ mô"
  };

  let allItems = [];
  let current = "all";

  fetch("data/news.json", { cache: "no-store" })
    .then(r => r.json())
    .then(data => {
      allItems = data.items || [];
      if (updatedEl && data.updated_at) {
        updatedEl.textContent = "Cập nhật lúc: " + data.updated_at;
      }
      buildFilters();
      render();
    })
    .catch(() => {
      listEl.innerHTML = `<div class="empty-note">
        Chưa tải được tin tức.<br>
        Bot <code>scripts/fetch-news.mjs</code> sẽ tự lấy tin và ghi vào <code>data/news.json</code>.
      </div>`;
    });

  function buildFilters() {
    if (!filterEl) return;
    const cats = ["all", ...new Set(allItems.map(i => i.category).filter(Boolean))];
    filterEl.innerHTML = cats.map(c => {
      const label = c === "all" ? "Tất cả" : (CAT_LABEL[c] || c);
      return `<button class="btn btn-ghost" data-cat="${c}">${label}</button>`;
    }).join("");
    filterEl.querySelectorAll("button").forEach(b => {
      b.addEventListener("click", () => {
        current = b.dataset.cat;
        filterEl.querySelectorAll("button").forEach(x => x.classList.remove("btn-primary"));
        b.classList.add("btn-primary");
        render();
      });
    });
    const firstBtn = filterEl.querySelector('button[data-cat="all"]');
    if (firstBtn) firstBtn.classList.add("btn-primary");
  }

  function render() {
    const items = current === "all"
      ? allItems
      : allItems.filter(i => i.category === current);

    if (!items.length) {
      listEl.innerHTML = `<div class="empty-note">Chưa có tin trong mục này.</div>`;
      return;
    }

    listEl.innerHTML = items.map(n => `
      <article class="news-item">
        <h3><a href="${n.link}" target="_blank" rel="noopener">${n.title_vi || n.title}</a></h3>
        <div class="news-meta">
          <span class="tag ${n.category || ""}">${CAT_LABEL[n.category] || "Hàng hóa"}</span>
          <span>${n.source || ""}</span>
          <span>${n.published || ""}</span>
        </div>
        ${n.summary_vi ? `<p class="news-summary">${n.summary_vi}</p>` : ""}
      </article>`).join("");
  }
})();
