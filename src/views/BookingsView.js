import { el } from "../utils/dom.js";
import { EmptyState } from "../components/ui/Empty.js";
import { Modal } from "../components/ui/Modal.js";
import { formatMoney, formatDateTime } from "../utils/format.js";
import { LoadingBlock, ErrorBlock, sectionHead } from "./_shared.js";

export function BookingsView({ api, store, toastHost }) {
  const userId = store.getState().session.userId;
  const root = el("div", { class: "section" }, el("div", { class: "container" }, LoadingBlock().el));
  let alive = true;

  async function load() {
    try {
      const { bookings } = await api.listBookings(userId);
      if (!alive) return;
      render({ bookings });
      store.log("bookings.viewed", { count: bookings.length });
    } catch (e) {
      if (!alive) return;
      toastHost.push({ title: "Couldn’t load bookings", message: e?.message || "Try again.", tone: "danger" });
      root.replaceChildren(el("div", { class: "container" }, ErrorBlock({ message: "Mock API error while loading bookings." }).el));
    }
  }

  function render({ bookings }) {
    const headerRight = el(
      "div",
      { style: { display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "flex-end" } },
      el("a", { class: "btn", href: "#/lots" }, "Browse lots"),
      el("a", { class: "btn primary", href: "#/billing" }, "Billing"),
    );

    const content =
      bookings.length === 0
        ? EmptyState({
            title: "No bookings yet",
            message: "Pick a lot, then create a booking from its details page.",
            action: { el: el("a", { class: "btn primary", href: "#/lots" }, "Find parking") },
          }).el
        : bookingsTable(bookings);

    const container = el(
      "div",
      { class: "container" },
      sectionHead({ title: "My bookings", subtitle: "Pending → pay to confirm. Cancel anytime (mock).", right: headerRight }),
      el("div", { class: "card" }, el("div", { class: "card-body", style: { overflowX: "auto" } }, content)),
    );
    root.replaceChildren(container);
  }

  function bookingsTable(bookings) {
    const tbody = el(
      "tbody",
      {},
      ...bookings.map((b) => {
        const lotName = b.lot?.lot_name ?? "—";
        const slotNum = b.slot?.slot_number ?? "—";
        const vehicle = b.vehicle?.vehicle_number ?? "—";

        const statusBadge = badgeForStatus(b.booking_status);

        const payBtn = el("button", { class: "btn small primary", type: "button", disabled: b.booking_status !== "pending_payment" }, "Pay");
        const cancelBtn = el("button", { class: "btn small danger", type: "button", disabled: b.booking_status === "cancelled" }, "Cancel");

        payBtn.addEventListener("click", () => openPayModal(b));
        cancelBtn.addEventListener("click", async () => {
          cancelBtn.disabled = true;
          try {
            await api.cancelBooking(userId, b.booking_id);
            toastHost.push({ title: "Booking cancelled", message: b.booking_id, tone: "success" });
            load();
          } catch (e) {
            toastHost.push({ title: "Cancel failed", message: e?.message || "Try again.", tone: "danger" });
          } finally {
            cancelBtn.disabled = false;
          }
        });

        return el(
          "tr",
          {},
          el("td", {}, el("div", { style: { fontWeight: 850 } }, lotName), el("div", { class: "card-meta" }, `Slot #${slotNum}`)),
          el("td", {}, el("div", {}, formatDateTime(b.start_time)), el("div", { class: "card-meta" }, `→ ${formatDateTime(b.end_time)}`)),
          el("td", {}, vehicle),
          el("td", {}, el("span", { class: `badge ${statusBadge.className}` }, statusBadge.label)),
          el("td", {}, formatMoney(b.total_cost)),
          el("td", {}, el("span", { class: "mono" }, b.booking_id)),
          el("td", {}, el("div", { style: { display: "flex", gap: "8px", flexWrap: "wrap" } }, payBtn, cancelBtn)),
        );
      }),
    );

    return el(
      "table",
      { class: "table" },
      el(
        "thead",
        {},
        el(
          "tr",
          {},
          el("th", {}, "Lot / Slot"),
          el("th", {}, "Time"),
          el("th", {}, "Vehicle"),
          el("th", {}, "Status"),
          el("th", {}, "Cost"),
          el("th", {}, "Booking ID"),
          el("th", {}, ""),
        ),
      ),
      tbody,
    );
  }

  function badgeForStatus(status) {
    const s = String(status || "");
    if (s === "confirmed") return { className: "success", label: "Confirmed" };
    if (s === "cancelled") return { className: "danger", label: "Cancelled" };
    return { className: "warning", label: "Pending payment" };
  }

  function openPayModal(booking) {
    const method = el(
      "select",
      { class: "control" },
      el("option", { value: "card" }, "Card"),
      el("option", { value: "upi" }, "UPI"),
      el("option", { value: "net_banking" }, "Net banking"),
    );

    const content = el(
      "div",
      { class: "form" },
      el("div", { class: "card-meta" }, "This is a mock checkout. Paying will generate a payment record and an invoice."),
      el("div", { class: "form-row" }, field("Method", method), field("Amount", el("input", { class: "control", value: formatMoney(booking.total_cost), disabled: true }))),
    );

    const modal = Modal({
      title: "Confirm payment",
      content,
      actions: [
        { label: "Cancel", variant: "ghost", onClick: (m) => m.close() },
        {
          label: "Pay now",
          variant: "primary",
          onClick: async (m) => {
            try {
              await api.payForBooking(userId, booking.booking_id, { payment_method: method.value });
              toastHost.push({ title: "Payment successful", message: "Booking confirmed and invoice issued.", tone: "success" });
              m.close();
              load();
            } catch (e) {
              toastHost.push({ title: "Payment failed", message: e?.message || "Try again.", tone: "danger" });
            }
          },
        },
      ],
    });

    document.body.appendChild(modal.el);
  }

  function field(label, control) {
    return el("div", { class: "field" }, el("label", {}, label), control);
  }

  load();

  return {
    el: root,
    cleanup() {
      alive = false;
    },
  };
}

