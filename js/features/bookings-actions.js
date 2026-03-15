import { query, on } from "../lib/dom.js";
import { show as showModal } from "./modal.js";
import { emit } from "../lib/events.js";
import { getBookings, saveBookings } from "../lib/storage.js";
import { TOAST_EVENT } from "./toast.js";

const EXTEND_SELECTOR = "[data-action=\"extend-booking\"]";
const CANCEL_SELECTOR = "[data-action=\"cancel-booking\"]";
const BOOKINGS_UPDATED_EVENT = "parkwise:bookings-updated";

function addOneHour(timeStr) {
  const match = timeStr.match(/(\d{1,2}):(\d{2})$/);
  if (!match) return timeStr;
  let h = parseInt(match[1], 10);
  const m = match[2];
  h = (h + 1) % 24;
  return timeStr.replace(/\d{1,2}:\d{2}$/, `${String(h).padStart(2, "0")}:${m}`);
}

function handleExtendClick(event) {
  const button = event.target.closest(EXTEND_SELECTOR);
  if (!button) return;

  const list = getBookings();
  const activeIndex = list.findIndex((b) => b.status === "Active");
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

  const list = getBookings();
  const activeIndex = list.findIndex((b) => b.status === "Active");
  if (activeIndex === -1) {
    emit(TOAST_EVENT, { message: "No active booking to cancel.", type: "info" });
    return;
  }

  showModal({
    title: "Cancel booking",
    body: "This will free your slot. You can book again anytime.",
    primaryLabel: "Cancel booking",
    secondaryLabel: "Keep",
    onPrimary: () => {
      list[activeIndex].status = "Cancelled";
      saveBookings(list);
      emit(BOOKINGS_UPDATED_EVENT);
      emit(TOAST_EVENT, { message: "Booking cancelled.", type: "success" });
    },
  });
}

export function init(root = document) {
  const extendBtn = root.querySelector(EXTEND_SELECTOR);
  const cancelBtn = root.querySelector(CANCEL_SELECTOR);

  if (extendBtn) on(extendBtn, "click", handleExtendClick);
  if (cancelBtn) on(cancelBtn, "click", handleCancelClick);
}
