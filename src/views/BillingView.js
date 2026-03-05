import { el } from "../utils/dom.js";
import { EmptyState } from "../components/ui/Empty.js";
import { formatMoney, formatDateTime } from "../utils/format.js";
import { LoadingBlock, ErrorBlock, sectionHead } from "./_shared.js";

export function BillingView({ api, store, toastHost }) {
  const userId = store.getState().session.userId;
  const root = el("div", { class: "section" }, el("div", { class: "container" }, LoadingBlock().el));
  let alive = true;

  async function load() {
    try {
      const { payments, invoices } = await api.listBilling(userId);
      if (!alive) return;
      render({ payments, invoices });
      store.log("billing.viewed", { payments: payments.length, invoices: invoices.length });
    } catch (e) {
      if (!alive) return;
      toastHost.push({ title: "Couldn’t load billing", message: e?.message || "Try again.", tone: "danger" });
      root.replaceChildren(el("div", { class: "container" }, ErrorBlock({ message: "Mock API error while loading billing." }).el));
    }
  }

  function render({ payments, invoices }) {
    const container = el(
      "div",
      { class: "container" },
      sectionHead({
        title: "Payments & invoices",
        subtitle: "Generated when you pay for a booking (mock).",
        right: el("a", { class: "btn", href: "#/bookings" }, "Back to bookings"),
      }),
      el(
        "div",
        { class: "grid" },
        blockCard("Payments", payments.length ? paymentsTable(payments) : EmptyState({ title: "No payments yet", message: "Pay for a booking to generate a payment record." }).el, 6),
        blockCard("Invoices", invoices.length ? invoicesTable(invoices) : EmptyState({ title: "No invoices yet", message: "Invoices are created after a successful payment." }).el, 6),
      ),
    );
    root.replaceChildren(container);
  }

  function blockCard(title, content, span) {
    return el(
      "div",
      { class: "card", style: { gridColumn: `span ${span}` } },
      el(
        "div",
        { class: "card-body" },
        el("h3", { class: "card-title" }, title),
        el("div", { style: { marginTop: "10px", overflowX: "auto" } }, content),
      ),
    );
  }

  function paymentsTable(payments) {
    return el(
      "table",
      { class: "table" },
      el("thead", {}, el("tr", {}, el("th", {}, "Time"), el("th", {}, "Method"), el("th", {}, "Status"), el("th", {}, "Amount"), el("th", {}, "Booking"), el("th", {}, "Payment ID"))),
      el(
        "tbody",
        {},
        ...payments.map((p) => {
          const badge = p.payment_status === "paid" ? "success" : "warning";
          return el(
            "tr",
            {},
            el("td", {}, formatDateTime(p.payment_time)),
            el("td", {}, String(p.payment_method).replace("_", " ")),
            el("td", {}, el("span", { class: `badge ${badge}` }, p.payment_status)),
            el("td", {}, formatMoney(p.amount)),
            el("td", { class: "mono" }, p.booking_id),
            el("td", { class: "mono" }, p.payment_id),
          );
        }),
      ),
    );
  }

  function invoicesTable(invoices) {
    return el(
      "table",
      { class: "table" },
      el("thead", {}, el("tr", {}, el("th", {}, "Date"), el("th", {}, "Status"), el("th", {}, "Total"), el("th", {}, "Booking"), el("th", {}, "Invoice ID"))),
      el(
        "tbody",
        {},
        ...invoices.map((i) => {
          const badge = i.status === "issued" ? "success" : "warning";
          return el(
            "tr",
            {},
            el("td", {}, formatDateTime(i.invoice_date)),
            el("td", {}, el("span", { class: `badge ${badge}` }, i.status)),
            el("td", {}, formatMoney(i.total_amount)),
            el("td", { class: "mono" }, i.booking_id),
            el("td", { class: "mono" }, i.invoice_id),
          );
        }),
      ),
    );
  }

  load();

  return {
    el: root,
    cleanup() {
      alive = false;
    },
  };
}

