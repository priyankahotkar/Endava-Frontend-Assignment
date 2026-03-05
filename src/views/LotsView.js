import { el } from "../utils/dom.js";
import { EmptyState } from "../components/ui/Empty.js";
import { formatMoney } from "../utils/format.js";
import { LoadingBlock, ErrorBlock, sectionHead } from "./_shared.js";

export function LotsView({ api, store, toastHost }) {
  const userId = store.getState().session.userId;
  const root = el("div", { class: "section" }, el("div", { class: "container" }, LoadingBlock().el));

  let alive = true;

  const filters = { ...store.getState().ui.lotFilters };

  function render({ lots }) {
    const query = el("input", {
      class: "control",
      placeholder: "Search by lot or address",
      value: filters.query || "",
      type: "search",
    });
    const openNow = el("input", { type: "checkbox", id: "openNow", checked: !!filters.openNow });
    const maxPrice = el("input", { class: "control", placeholder: "Max hourly rate", value: filters.maxPrice ?? "", inputmode: "decimal" });

    const toolbar = el(
      "div",
      { class: "toolbar" },
      el(
        "div",
        { class: "toolbar-left" },
        el("div", { class: "field", style: { minWidth: "320px" } }, el("label", {}, "Search"), query),
        el(
          "div",
          { class: "field" },
          el("label", { for: "openNow" }, "Open now"),
          el("div", { style: { display: "flex", alignItems: "center", gap: "10px", padding: "10px 0" } }, openNow, el("span", { class: "card-meta" }, "Only show lots open right now")),
        ),
        el("div", { class: "field", style: { width: "180px" } }, el("label", {}, "Max price"), maxPrice),
      ),
      el(
        "div",
        { class: "toolbar-right" },
        el("a", { class: "btn primary", href: "#/bookings" }, "My bookings"),
      ),
    );

    query.addEventListener("input", () => {
      filters.query = query.value;
      store.patch("ui.lotFilters", { ...filters });
      refresh();
    });
    openNow.addEventListener("change", () => {
      filters.openNow = openNow.checked;
      store.patch("ui.lotFilters", { ...filters });
      refresh();
    });
    maxPrice.addEventListener("input", () => {
      filters.maxPrice = maxPrice.value;
      store.patch("ui.lotFilters", { ...filters });
      refresh();
    });

    const grid = el("div", { class: "grid" });
    for (const lot of lots) {
      grid.appendChild(lotCard(lot));
    }

    const content =
      lots.length === 0
        ? EmptyState({
            title: "No lots match your filters",
            message: "Try clearing the search or increasing the max price.",
            action: { el: el("a", { class: "btn small", href: "#/lots" }, "Reset") },
          }).el
        : grid;

    const container = el(
      "div",
      { class: "container" },
      sectionHead({ title: "Parking lots", subtitle: "Fake data now, real APIs later." }),
      toolbar,
      content,
    );
    root.replaceChildren(container);
  }

  function lotCard(lot) {
    const available = lot.stats?.available ?? 0;
    const maintenance = lot.stats?.maintenance ?? 0;
    const open = !!lot.open_now;

    const statusPill = open
      ? el("span", { class: "pill" }, el("span", { class: "dot success" }), "Open now")
      : el("span", { class: "pill" }, el("span", { class: "dot warning" }), "Closed");

    const availabilityPill =
      available > 0
        ? el("span", { class: "pill" }, el("span", { class: "dot success" }), `${available} available`)
        : el("span", { class: "pill" }, el("span", { class: "dot danger" }), "No availability");

    const maintPill = maintenance
      ? el("span", { class: "pill" }, el("span", { class: "dot" }), `${maintenance} maintenance`)
      : null;

    return el(
      "div",
      { class: "card", style: { gridColumn: "span 6" } },
      el(
        "div",
        { class: "card-body" },
        el("h3", { class: "card-title" }, lot.lot_name),
        el("p", { class: "card-meta" }, lot.address),
        el("div", { class: "pill-row" }, statusPill, availabilityPill, maintPill),
        el(
          "div",
          { class: "card-row" },
          el("div", {}, el("div", { style: { fontWeight: 850, letterSpacing: "-0.02em" } }, formatMoney(lot.hourly_rate)), el("div", { class: "card-meta" }, "per hour")),
          el("a", { class: "btn small", href: `#/lots/${encodeURIComponent(lot.lot_id)}` }, "View details"),
        ),
      ),
    );
  }

  async function refresh() {
    try {
      const { lots } = await api.listLots(filters);
      if (!alive) return;
      render({ lots });
      store.log("lots.viewed", { count: lots.length, filters });
    } catch (e) {
      if (!alive) return;
      toastHost.push({ title: "Couldn’t load lots", message: e?.message || "Try again.", tone: "danger" });
      root.replaceChildren(el("div", { class: "container" }, ErrorBlock({ message: "Mock API error while loading lots." }).el));
    }
  }

  api.getMe(userId).catch(() => {});
  refresh();

  return {
    el: root,
    cleanup() {
      alive = false;
    },
  };
}

