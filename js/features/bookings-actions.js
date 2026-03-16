import { query, on } from "../lib/dom.js";
import { show as showModal } from "./modal.js";
import { emit } from "../lib/events.js";
import { getBookings, saveBookings } from "../lib/storage.js";
import { TOAST_EVENT } from "./toast.js";

const EXTEND_SELECTOR = "[data-action=\"extend-booking\"]";
const CANCEL_SELECTOR = "[data-action=\"cancel-booking\"]";
const SELECT_ALL_SELECTOR = "[data-action=\"select-all-active-bookings\"]";
const BOOKINGS_UPDATED_EVENT = "parkwise:bookings-updated";
const SELECTED_BOOKING_SELECTOR = "[data-booking-select]:checked";

function addOneHour(timeStr) {
  const match = timeStr.match(/(\d{1,2}):(\d{2})$/);
  if (!match) return timeStr;
  let h = parseInt(match[1], 10);
  const m = match[2];
  h = (h + 1) % 24;
  return timeStr.replace(/\d{1,2}:\d{2}$/, `${String(h).padStart(2, "0")}:${m}`);
}

function getSelectedActiveBookingIds(root = document) {
  return Array.from(root.querySelectorAll(SELECTED_BOOKING_SELECTOR))
    .map((el) => el.getAttribute("data-booking-id"))
    .filter(Boolean);
}

function handleSelectAll(event) {
  const checkbox = event.target.closest(SELECT_ALL_SELECTOR);
  if (!checkbox) return;
  const root = checkbox.closest(".app-shell") || document;
  const checked = checkbox.checked;
  root.querySelectorAll("[data-booking-select]").forEach((cb) => {
    cb.checked = checked;
  });
}

function handleExtendClick(event) {
  const button = event.target.closest(EXTEND_SELECTOR);
  if (!button) return;

  const list = getBookings();
  const root = button.closest(".app-shell") || document;
  const selected = getSelectedActiveBookingIds(root);
  const activeIndex =
    selected.length === 1
      ? list.findIndex((b) => b.id === selected[0] && b.status === "Active")
      : list.findIndex((b) => b.status === "Active");

  if (selected.length > 1) {
    emit(TOAST_EVENT, { message: "Select only one active booking to extend.", type: "info" });
    return;
  }

  if (activeIndex === -1) {
    emit(TOAST_EVENT, { message: "No active booking to extend.", type: "info" });
    return;
  }

  showModal({
    title: "Extend booking",
    body: "Add 1 hour to your current booking?",
    primaryLabel: "Extend",
    secondaryLabel: "Cancel",
    onPrimary: () => {
      list[activeIndex].end = addOneHour(list[activeIndex].end);
      saveBookings(list);
      emit(BOOKINGS_UPDATED_EVENT);
      emit(TOAST_EVENT, { message: "Booking extended.", type: "success" });
    },
  });
}

function handleCancelClick(event) {
  const button = event.target.closest(CANCEL_SELECTOR);
  if (!button) return;

  const root = button.closest(".app-shell") || document;
  const selectedIds = getSelectedActiveBookingIds(root);

  if (selectedIds.length === 0) {
    emit(TOAST_EVENT, { message: "Select one or more active bookings to cancel.", type: "info" });
    return;
  }

  showModal({
    title: "Cancel booking",
    body: `Cancel <strong>${selectedIds.length}</strong> selected booking(s)? This will free the slot(s).`,
    primaryLabel: "Cancel selected",
    secondaryLabel: "Keep",
    onPrimary: () => {
      const list = getBookings();
      const idSet = new Set(selectedIds);
      let cancelled = 0;
      const updated = list.map((b) => {
        if (b.status === "Active" && idSet.has(b.id)) {
          cancelled += 1;
          return { ...b, status: "Cancelled" };
        }
        return b;
      });
      saveBookings(updated);
      emit(BOOKINGS_UPDATED_EVENT);
      emit(TOAST_EVENT, { message: `${cancelled} booking(s) cancelled.`, type: "success" });

      const selectAll = root.querySelector(SELECT_ALL_SELECTOR);
      if (selectAll) selectAll.checked = false;
    },
  });
}

export function init(root = document) {
  const extendBtn = root.querySelector(EXTEND_SELECTOR);
  const cancelBtn = root.querySelector(CANCEL_SELECTOR);
  const selectAll = root.querySelector(SELECT_ALL_SELECTOR);

  if (extendBtn) on(extendBtn, "click", handleExtendClick);
  if (cancelBtn) on(cancelBtn, "click", handleCancelClick);
  if (selectAll) on(selectAll, "change", handleSelectAll);
}
