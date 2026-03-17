import { query } from "../lib/dom.js";
import { getBookings } from "../lib/storage.js";
import { on as subscribe } from "../lib/events.js";
import { emit } from "../lib/events.js";
import { TOAST_EVENT } from "./toast.js";

const BOOKINGS_LIST_SELECTOR = "[data-bookings-list]";
const BOOKINGS_SEARCH_SELECTOR = "[data-bookings-search]";
const BOOKINGS_UPDATED_EVENT = "parkwise:bookings-updated";

let currentSearchTerm = "";

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

function selectionCell(booking) {
  if (booking.status !== "Active") return "<td></td>";
  return `<td>
    <input
      type="checkbox"
      data-booking-select
      data-booking-id="${escapeHtml(booking.id)}"
      aria-label="Select booking ${escapeHtml(booking.id)}"
    />
  </td>`;
}

function filterBookings(bookings, searchTerm) {
  if (!searchTerm.trim()) return bookings;
  
  const term = searchTerm.toLowerCase().trim();
  return bookings.filter(booking => {
    const searchableText = [
      booking.lotName,
      booking.vehiclePlate,
      booking.status,
      booking.slotType,
      booking.slotNumber,
      booking.start,
      booking.end,
      booking.total
    ].filter(Boolean).join(' ').toLowerCase();
    
    return searchableText.includes(term);
  });
}

function updateBadgeCounts(root = document, bookings) {
  const activeCount = bookings.filter(b => b.status === "Active").length;
  const pastCount = bookings.filter(b => b.status !== "Active").length;
  
  const activeBadge = root.querySelector('.badge--success');
  const pastBadge = root.querySelector('.badge--warning');
  
  if (activeBadge) activeBadge.textContent = `${activeCount} active`;
  if (pastBadge) pastBadge.textContent = `${pastCount} past`;
}

function renderBookings(root = document, searchTerm = "") {
  const tbody = root.querySelector(BOOKINGS_LIST_SELECTOR);
  if (!tbody) return;

  const allBookings = getBookings();
  const filteredBookings = filterBookings(allBookings, searchTerm);
  
  tbody.innerHTML = filteredBookings
    .map(
      (b) =>
        `<tr>
          ${selectionCell(b)}
          <td><span class="${statusBadgeClass(b.status)}">${escapeHtml(b.status)}</span></td>
          <td>${escapeHtml(b.lotName)}</td>
          <td>${escapeHtml([b.slotType, b.slotNumber].filter(Boolean).join(" · ") || "—")}</td>
          <td class="mono">${escapeHtml(b.vehiclePlate || "—")}</td>
          <td>${escapeHtml(b.start)}</td>
          <td>${escapeHtml(b.end)}</td>
          <td>${escapeHtml(b.total)}</td>
        </tr>`
    )
    .join("");
    
  updateBadgeCounts(root, filteredBookings);
}

function showPaidToast() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("paid") === "1") {
    emit(TOAST_EVENT, { message: "Booking confirmed! Your slot is reserved.", type: "success" });
    window.history.replaceState({}, "", window.location.pathname);
  }
}

function handleSearchInput(root = document) {
  const searchInput = root.querySelector(BOOKINGS_SEARCH_SELECTOR);
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    currentSearchTerm = e.target.value;
    renderBookings(root, currentSearchTerm);
  });
}

export function init(root = document) {
  renderBookings(root, currentSearchTerm);
  handleSearchInput(root);
  showPaidToast();
  subscribe(BOOKINGS_UPDATED_EVENT, () => renderBookings(root, currentSearchTerm));
}

export { BOOKINGS_UPDATED_EVENT };
