import { query, queryAll, on } from "./lib/dom.js";
import { getSelectedLot, setSelectedSlot } from "./lib/storage.js";
import { getSlotsForLot } from "./data/lots.js";

const LOT_NAME_EL = "slot-selection-lot-name";
const LOT_ADDRESS_EL = "slot-selection-lot-address";
const SLOT_LIST_SELECTOR = "[data-slot-list]";
const VEHICLE_TYPE_BTNS = "[data-vehicle-type]";
const DURATION_SELECTOR = "[data-duration-select]";
const FARE_DISPLAY_ID = "fare-display";
const PROCEED_BTN_SELECTOR = "[data-action=\"proceed-to-pay\"]";

let selectedLot = null;
let selectedSlotData = null;
let currentVehicleType = "Car";

function renderSlots(slots) {
  const container = document.querySelector(SLOT_LIST_SELECTOR);
  if (!container) return;
  container.innerHTML = "";
  slots.forEach((slot) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pill slot-option";
    btn.setAttribute("data-slot-id", slot.id);
    btn.setAttribute("data-slot-number", slot.number);
    btn.setAttribute("data-slot-type", slot.type);
    btn.textContent = slot.number;
    btn.addEventListener("click", () => selectSlot(slot));
    container.appendChild(btn);
  });
}

function selectSlot(slot) {
  queryAll(".slot-option").forEach((b) => b.classList.remove("slot-option--selected"));
  const btn = document.querySelector(`[data-slot-id="${slot.id}"]`);
  if (btn) btn.classList.add("slot-option--selected");
  selectedSlotData = slot;
  updateProceedButton();
  updateFare();
}

function updateFare() {
  const durationEl = document.querySelector(DURATION_SELECTOR);
  const fareEl = document.getElementById(FARE_DISPLAY_ID);
  if (!fareEl || !selectedLot) return;
  const hours = durationEl ? parseInt(durationEl.value, 10) || 3 : 3;
  const total = (selectedLot.ratePerHour * hours).toFixed(2);
  fareEl.textContent = `$${total}`;
  if (selectedSlotData) {
    selectedSlotData.durationHours = hours;
    selectedSlotData.fare = total;
  }
}

function updateProceedButton() {
  const btn = document.querySelector(PROCEED_BTN_SELECTOR);
  if (btn) btn.disabled = !selectedSlotData;
}

function initPage() {
  selectedLot = getSelectedLot();
  if (!selectedLot || !selectedLot.id) {
    window.location.href = "./lots.html";
    return;
  }

  const nameEl = document.getElementById(LOT_NAME_EL);
  const addressEl = document.getElementById(LOT_ADDRESS_EL);
  if (nameEl) nameEl.textContent = selectedLot.name;
  if (addressEl) addressEl.textContent = selectedLot.address;

  const slots = getSlotsForLot(selectedLot.id, currentVehicleType);
  renderSlots(slots);

  queryAll(VEHICLE_TYPE_BTNS).forEach((btn) => {
    btn.addEventListener("click", () => {
      currentVehicleType = btn.getAttribute("data-vehicle-type");
      selectedSlotData = null;
      queryAll(VEHICLE_TYPE_BTNS).forEach((b) => b.setAttribute("aria-selected", "false"));
      btn.setAttribute("aria-selected", "true");
      renderSlots(getSlotsForLot(selectedLot.id, currentVehicleType));
      updateProceedButton();
      updateFare();
    });
  });

  const durationEl = document.querySelector(DURATION_SELECTOR);
  if (durationEl) durationEl.addEventListener("change", updateFare);

  const proceedBtn = document.querySelector(PROCEED_BTN_SELECTOR);
  if (proceedBtn) {
    proceedBtn.addEventListener("click", () => {
      if (!selectedSlotData || !selectedLot) return;
      updateFare();
      setSelectedSlot({
        slotId: selectedSlotData.id,
        slotNumber: selectedSlotData.number,
        slotType: selectedSlotData.type,
        fare: selectedSlotData.fare || (selectedLot.ratePerHour * (parseInt(durationEl?.value, 10) || 3)).toFixed(2),
        durationHours: selectedSlotData.durationHours || parseInt(durationEl?.value, 10) || 3,
      });
      window.location.href = "./payment.html";
    });
  }

  updateFare();
}

initPage();
