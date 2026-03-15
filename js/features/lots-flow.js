import { query, queryAll, on } from "../lib/dom.js";
import { setSelectedLot } from "../lib/storage.js";
import { distanceKm } from "../data/lots.js";
import { emit } from "../lib/events.js";
import { TOAST_EVENT } from "./toast.js";

const GRID_SELECTOR = "[data-lots-grid]";
const CARD_SELECTOR = ".lot-card";
const USE_LOCATION_SELECTOR = "[data-action=\"use-location\"]";
const BOOK_HERE_SELECTOR = "[data-action=\"book-here\"]";

function getCardLotData(card) {
  const lat = parseFloat(card.getAttribute("data-lat"));
  const lng = parseFloat(card.getAttribute("data-lng"));
  const rateDay = card.getAttribute("data-rate-day");
  return {
    id: card.getAttribute("data-lot-id"),
    name: card.getAttribute("data-lot-name"),
    address: card.getAttribute("data-address") || "",
    lat,
    lng,
    ratePerHour: parseFloat(card.getAttribute("data-rate-hour")) || 0,
    ratePerDay: rateDay ? parseFloat(rateDay) : null,
  };
}

function sortCardsByDistance(grid, userLat, userLng) {
  const cards = queryAll(CARD_SELECTOR, grid);
  const withDistance = cards.map((card) => {
    const lat = parseFloat(card.getAttribute("data-lat"));
    const lng = parseFloat(card.getAttribute("data-lng"));
    const km = distanceKm(userLat, userLng, lat, lng);
    return { card, km };
  });
  withDistance.sort((a, b) => a.km - b.km);
  withDistance.forEach(({ card, km }) => {
    const label = card.querySelector("[data-distance-label]");
    if (label) {
      const address = card.getAttribute("data-address") || "";
      const rest = address.replace(/^[\d.]+\s*km\s*·?\s*/i, "").trim();
      label.textContent = rest ? `${km} km · ${rest}` : `${km} km`;
    }
    grid.appendChild(card);
  });
}

function handleUseLocation(event) {
  const btn = event.target.closest(USE_LOCATION_SELECTOR);
  if (!btn) return;
  const grid = query(GRID_SELECTOR, btn.closest(".app-shell") || document);
  if (!grid) return;

  btn.disabled = true;
  btn.textContent = "Locating…";

  if (!navigator.geolocation) {
    emit(TOAST_EVENT, { message: "Geolocation is not supported.", type: "error" });
    btn.disabled = false;
    btn.textContent = "Use my location";
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      sortCardsByDistance(grid, pos.coords.latitude, pos.coords.longitude);
      emit(TOAST_EVENT, { message: "Sorted by distance from you.", type: "success" });
      btn.textContent = "Sorted";
    },
    () => {
      emit(TOAST_EVENT, { message: "Could not get location. Showing default order.", type: "info" });
      btn.disabled = false;
      btn.textContent = "Use my location";
    }
  );
}

function handleBookHere(event) {
  const link = event.target.closest(BOOK_HERE_SELECTOR);
  if (!link || link.tagName !== "A") return;
  const card = link.closest(CARD_SELECTOR);
  if (!card) return;

  event.preventDefault();
  const lot = getCardLotData(card);
  setSelectedLot(lot);
  window.location.href = link.getAttribute("href") || "./slot-selection.html";
}

export function init(root = document) {
  const grid = root.querySelector(GRID_SELECTOR);
  const useLocationBtn = root.querySelector(USE_LOCATION_SELECTOR);
  if (useLocationBtn) on(useLocationBtn, "click", handleUseLocation);

  if (grid) {
    grid.querySelectorAll(BOOK_HERE_SELECTOR).forEach((el) => {
      on(el, "click", handleBookHere);
    });
  }
}
