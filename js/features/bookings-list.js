import { query } from "../lib/dom.js";
import { getBookings } from "../lib/storage.js";
import { on as subscribe } from "../lib/events.js";
import { emit } from "../lib/events.js";
import { TOAST_EVENT } from "./toast.js";

const BOOKINGS_LIST_SELECTOR = "[data-bookings-list]";
const BOOKINGS_UPDATED_EVENT = "parkwise:bookings-updated";

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function statusBadgeClass(status) {
  if (status === "Active") return "badge badge--success";
  if (status === "Cancelled") return "badge badge--danger";
  return "badge badge--warning";
}

function renderBookings(root = document) {
  const tbody = root.querySelector(BOOKINGS_LIST_SELECTOR);
  if (!tbody) return;

  const list = getBookings();
  tbody.innerHTML = list
    .map(
      (b) =>
        `<tr>
          <td><span class="${statusBadgeClass(b.status)}">${escapeHtml(b.status)}</span></td>
          <td>${escapeHtml(b.lotName)}</td>
          <td class="mono">${escapeHtml(b.vehiclePlate || "—")}</td>
          <td>${escapeHtml(b.start)}</td>
          <td>${escapeHtml(b.end)}</td>
          <td>${escapeHtml(b.total)}</td>
        </tr>`
    )
    .join("");
}

function showPaidToast() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("paid") === "1") {
    emit(TOAST_EVENT, { message: "Booking confirmed! Your slot is reserved.", type: "success" });
    window.history.replaceState({}, "", window.location.pathname);
  }
}

export function init(root = document) {
  renderBookings(root);
  showPaidToast();
  subscribe(BOOKINGS_UPDATED_EVENT, () => renderBookings(root));
}

export { BOOKINGS_UPDATED_EVENT };
