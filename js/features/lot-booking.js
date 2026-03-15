import { query, on } from "../lib/dom.js";
import { setSelectedLot } from "../lib/storage.js";

const BUTTON_SELECTOR = "[data-action=\"book-lot\"]";

function getLotFromButton(button) {
  const rateDay = button.getAttribute("data-rate-day");
  return {
    id: button.getAttribute("data-lot-id") || "central-plaza",
    name: button.getAttribute("data-lot-name") || "Central Plaza Garage",
    address: button.getAttribute("data-address") || "",
    ratePerHour: parseFloat(button.getAttribute("data-rate-hour")) || 3.5,
    ratePerDay: rateDay ? parseFloat(rateDay) : null,
  };
}

function handleBookClick(event) {
  const button = event.target.closest(BUTTON_SELECTOR);
  if (!button) return;
  event.preventDefault();

  const lot = getLotFromButton(button);
  setSelectedLot(lot);
  window.location.href = "./slot-selection.html";
}

export function init(root = document) {
  const button = root.querySelector(BUTTON_SELECTOR);
  if (!button) return;
  on(button, "click", handleBookClick);
}
