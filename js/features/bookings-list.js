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

function formatDateDisplay(dateTimeStr) {
  if (!dateTimeStr) return "";
  
  // Handle different date formats:
  // 1. "17 Mar 2026 10:00" (new format: day month year time)
  // 2. "Today 10:00" (current day format)
  // 3. "Today 17 Mar 10:00" (old format: Today day month time)
  // 4. "Mar 02 09:30" (old format: month day time)
  
  const parts = dateTimeStr.split(" ");
  
  if (parts.length === 4 && parts[0] === "Today") {
    // Format: "Today 17 Mar 10:00" - old format with Today prefix
    const day = parts[1];
    const month = parts[2];
    const time = parts[3];
    const currentYear = new Date().getFullYear();
    const dateStr = `${day} ${month} ${currentYear}`;
    
    const today = new Date();
    const todayStr = `${today.getDate()} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][today.getMonth()]} ${today.getFullYear()}`;
    
    if (dateStr === todayStr) {
      return `Today ${time}`;
    }
    return `${dateStr} ${time}`;
  } else if (parts.length === 4) {
    // Format: "17 Mar 2026 10:00" - new format
    const day = parts[0];
    const month = parts[1];
    const year = parts[2];
    const time = parts[3];
    const dateStr = `${day} ${month} ${year}`;
    
    const today = new Date();
    const todayStr = `${today.getDate()} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][today.getMonth()]} ${today.getFullYear()}`;
    
    if (dateStr === todayStr) {
      return `Today ${time}`;
    }
    return dateTimeStr;
  } else if (parts.length === 2 && parts[0] === "Today") {
    // Format: "Today 10:00" - this is already correctly formatted for today
    return dateTimeStr;
  } else if (parts.length === 3) {
    // Format: "Mar 02 09:30" - old format, assume current year
    const month = parts[0];
    const day = parts[1];
    const time = parts[2];
    const currentYear = new Date().getFullYear();
    const dateStr = `${day} ${month} ${currentYear}`;
    
    const today = new Date();
    const todayStr = `${today.getDate()} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][today.getMonth()]} ${today.getFullYear()}`;
    
    if (dateStr === todayStr) {
      return `Today ${time}`;
    }
    return `${dateStr} ${time}`;
  }
  
  // Fallback: return as-is
  return dateTimeStr;
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
          <td>${escapeHtml(formatDateDisplay(b.start))}</td>
          <td>${escapeHtml(formatDateDisplay(b.end))}</td>
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
