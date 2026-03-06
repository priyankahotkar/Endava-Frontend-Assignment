import { el } from "../utils/dom.js";

export function HomeView({ api, store, toastHost }) {
  const state = store.getState();
  const userId = state.session.userId;

  const root = el("div", {});
  const hero = el(
    "section",
    { class: "hero" },
    el(
      "div",
      { class: "container" },
      el(
        "div",
        { class: "hero-grid" },
        el(
          "div",
          { class: "hero-card" },
          el("h1", {}, "Book a spot. Keep your day moving."),
          el(
            "p",
            {},
            "A clean mock frontend for a parking booking system — lots, slots, vehicles, bookings, and billing. Swap the mock API with your backend later without rewriting the UI.",
          ),
          el(
            "div",
            { class: "toolbar", style: { marginTop: "14px" } },
            el("div", { class: "toolbar-left" }, quickCta()),
            el("div", { class: "toolbar-right" }, resetBtn()),
          ),
        ),
        el(
          "aside",
          { class: "hero-aside" },
          el("div", { style: { fontWeight: 850, marginBottom: "12px", letterSpacing: "-0.02em" } }, "Today at a glance"),
          stat("Lots available", "—", "stat-total"),
          stat("Open now", "—", "stat-open"),
          stat("Your active bookings", "—", "stat-active"),
        ),
      ),
    ),
  );

  const section = el(
    "section",
    { class: "section" },
    el(
      "div",
      { class: "container" },
      el(
        "div",
        { class: "section-head" },
        el("h2", { class: "section-title" }, "Start here"),
      ),
      el(
        "div",
        { class: "grid" },
        actionCard("Browse lots", "Find nearby lots, check prices, and see availability.", "/lots"),
        actionCard("Manage vehicles", "Add vehicle numbers used for bookings.", "/vehicles"),
        actionCard("Review bookings", "Pay, cancel, and track booking statuses.", "/bookings"),
        actionCard("Billing", "View payments and invoices created by mock checkout.", "/billing"),
      ),
    ),
  );

  root.append(hero, section);

  let alive = true;
  api
    .stats(userId)
    .then(({ stats }) => {
      if (!alive) return;
      setText("stat-total", String(stats.totalLots));
      setText("stat-open", String(stats.openLots));
      setText("stat-active", String(stats.activeBookings));
    })
    .catch(() => {
      toastHost.push({ title: "Couldn’t load stats", message: "The mock API is unavailable.", tone: "danger" });
    });

  function setText(id, value) {
    const n = root.querySelector(`[data-stat="${id}"] .v`);
    if (n) n.textContent = value;
  }

  function stat(label, value, id) {
    return el(
      "div",
      { class: "stat", dataset: { stat: id } },
      el("div", { class: "k" }, label),
      el("div", { class: "v" }, value),
    );
  }

  function actionCard(title, desc, path) {
    return el(
      "div",
      { class: "card", style: { gridColumn: "span 6" } },
      el(
        "div",
        { class: "card-body" },
        el("h3", { class: "card-title" }, title),
        el("p", { class: "card-meta" }, desc),
        el(
          "div",
          { class: "card-row" },
          el("span", { class: "mono" }, path),
          el("a", { class: "btn small", href: `#${path}` }, "Open"),
        ),
      ),
    );
  }

  function quickCta() {
    const a = el("a", { class: "btn primary", href: "#/lots" }, "Find parking");
    return a;
  }

  function resetBtn() {
    const btn = el("button", { class: "btn", type: "button" }, "Reset mock data");
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      try {
        await api.reset();
        toastHost.push({ title: "Reset complete", message: "Mock data restored to defaults.", tone: "success" });
        window.location.hash = "#/";
        window.location.reload();
      } catch (e) {
        toastHost.push({ title: "Reset failed", message: e?.message || "Try again.", tone: "danger" });
      } finally {
        btn.disabled = false;
      }
    });
    return btn;
  }

  return {
    el: root,
    cleanup() {
      alive = false;
    },
  };
}

