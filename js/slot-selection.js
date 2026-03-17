import { query, queryAll, on } from "./lib/dom.js";
import { getSelectedLot, setSelectedSlot, getVehicles } from "./lib/storage.js";
import { getSlotsForLot, getSlotTypeForVehicle } from "./data/lots.js";

const LOT_NAME_EL = "slot-selection-lot-name";
const LOT_ADDRESS_EL = "slot-selection-lot-address";
const SLOT_LIST_SELECTOR = "[data-slot-list]";
const VEHICLE_SELECTION_MODE_SELECTOR = "[data-vehicle-selection-mode]";
const QUICK_SELECTION_SELECTOR = "[data-quick-selection]";
const SAVED_VEHICLES_SELECTOR = "[data-saved-vehicles]";
const VEHICLE_TYPE_SELECT_SELECTOR = "[data-vehicle-type-select]";
const QUICK_PLATE_SELECTOR = "[data-quick-plate]";
const QUICK_NICKNAME_SELECTOR = "[data-quick-nickname]";
const SAVED_VEHICLE_SELECT_SELECTOR = "[data-saved-vehicle-select]";
const DURATION_SELECTOR = "[data-duration-select]";
const FARE_DISPLAY_ID = "fare-display";
const PROCEED_BTN_SELECTOR = "[data-action=\"proceed-to-pay\"]";

let selectedLot = null;
let selectedSlotData = null;
let selectionMode = "quick"; // "quick" or "saved"
let selectedVehicleData = null; // Will contain either quick entry data or saved vehicle data

function initVehicleSelection() {
  // Set up mode selection listeners
  const modeRadios = document.querySelectorAll('input[name="vehicle-selection-mode"]');
  modeRadios.forEach(radio => {
    on(radio, 'change', (e) => {
      selectionMode = e.target.value;
      toggleSelectionMode();
      updateSlotsForSelection();
      updateProceedButton();
    });
  });

  // Set up quick selection listeners
  const vehicleTypeSelect = document.querySelector(VEHICLE_TYPE_SELECT_SELECTOR);
  const quickPlateInput = document.querySelector(QUICK_PLATE_SELECTOR);
  const quickNicknameInput = document.querySelector(QUICK_NICKNAME_SELECTOR);
  
  if (vehicleTypeSelect) {
    on(vehicleTypeSelect, 'change', updateQuickSelection);
  }
  if (quickPlateInput) {
    on(quickPlateInput, 'input', updateQuickSelection);
  }
  if (quickNicknameInput) {
    on(quickNicknameInput, 'input', updateQuickSelection);
  }

  // Set up saved vehicles listener
  const savedVehicleSelect = document.querySelector(SAVED_VEHICLE_SELECT_SELECTOR);
  if (savedVehicleSelect) {
    on(savedVehicleSelect, 'change', (e) => {
      const selectedIndex = e.target.value;
      if (selectedIndex) {
        const vehicles = getVehicles();
        selectedVehicleData = vehicles[parseInt(selectedIndex)];
      } else {
        selectedVehicleData = null;
      }
      updateSlotsForSelection();
      updateProceedButton();
    });
  }

  // Initialize with quick selection
  toggleSelectionMode();
  renderSavedVehiclesDropdown();
  updateQuickSelection();
}

function toggleSelectionMode() {
  const quickSection = document.querySelector(QUICK_SELECTION_SELECTOR);
  const savedSection = document.querySelector(SAVED_VEHICLES_SELECTOR);
  
  if (selectionMode === "quick") {
    quickSection.style.display = "block";
    savedSection.style.display = "none";
  } else {
    quickSection.style.display = "none";
    savedSection.style.display = "block";
  }
}

function renderSavedVehiclesDropdown() {
  const select = document.querySelector(SAVED_VEHICLE_SELECT_SELECTOR);
  if (!select) return;

  const vehicles = getVehicles();
  if (vehicles.length === 0) {
    select.innerHTML = '<option value="">No vehicles saved</option>';
    return;
  }

  select.innerHTML = '<option value="">Choose a vehicle...</option>' +
    vehicles.map((vehicle, index) => 
      `<option value="${index}">${vehicle.plate} ${vehicle.nickname ? `(${vehicle.nickname})` : ''} - ${vehicle.type}</option>`
    ).join('');
}

function updateQuickSelection() {
  const vehicleTypeSelect = document.querySelector(VEHICLE_TYPE_SELECT_SELECTOR);
  const quickPlateInput = document.querySelector(QUICK_PLATE_SELECTOR);
  const quickNicknameInput = document.querySelector(QUICK_NICKNAME_SELECTOR);
  
  if (!vehicleTypeSelect) return;
  
  selectedVehicleData = {
    type: vehicleTypeSelect.value,
    plate: quickPlateInput?.value?.trim() || null,
    nickname: quickNicknameInput?.value?.trim() || null,
    isQuickEntry: true
  };
  
  updateSlotsForSelection();
  updateProceedButton();
}

function updateSlotsForSelection() {
  if (!selectedLot) return;

  let slotType;
  if (selectionMode === "quick" && selectedVehicleData) {
    slotType = selectedVehicleData.type;
  } else if (selectionMode === "saved" && selectedVehicleData) {
    slotType = getSlotTypeForVehicle(selectedVehicleData.type);
  } else {
    // No selection, clear slots
    renderSlots([]);
    return;
  }

  const slots = getSlotsForLot(selectedLot.id, slotType);
  renderSlots(slots);
}

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
    container.appendChild(btn);
  });
}

function getSlotFromButton(button) {
  return {
    id: button.getAttribute("data-slot-id"),
    number: button.getAttribute("data-slot-number"),
    type: button.getAttribute("data-slot-type"),
  };
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
  if (btn) btn.disabled = !selectedSlotData || !selectedVehicleData;
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

  initVehicleSelection();

  const slotList = document.querySelector(SLOT_LIST_SELECTOR);
  if (slotList) {
    slotList.addEventListener("click", (e) => {
      const button = e.target.closest(".slot-option");
      if (!button) return;
      selectSlot(getSlotFromButton(button));
    });
  }

  const durationEl = document.querySelector(DURATION_SELECTOR);
  if (durationEl) durationEl.addEventListener("change", updateFare);

  const proceedBtn = document.querySelector(PROCEED_BTN_SELECTOR);
  if (proceedBtn) {
    proceedBtn.addEventListener("click", () => {
      if (!selectedSlotData || !selectedLot || !selectedVehicleData) return;
      updateFare();
      
      const bookingData = {
        slotId: selectedSlotData.id,
        slotNumber: selectedSlotData.number,
        slotType: selectedSlotData.type,
        fare: selectedSlotData.fare || (selectedLot.ratePerHour * (parseInt(durationEl?.value, 10) || 3)).toFixed(2),
        durationHours: selectedSlotData.durationHours || parseInt(durationEl?.value, 10) || 3,
      };

      // Add vehicle information based on selection mode
      if (selectionMode === "quick") {
        bookingData.vehicleType = selectedVehicleData.type;
        if (selectedVehicleData.plate) bookingData.vehiclePlate = selectedVehicleData.plate;
        if (selectedVehicleData.nickname) bookingData.vehicleNickname = selectedVehicleData.nickname;
      } else {
        // Saved vehicle
        bookingData.vehiclePlate = selectedVehicleData.plate;
        bookingData.vehicleType = selectedVehicleData.type;
        if (selectedVehicleData.nickname) bookingData.vehicleNickname = selectedVehicleData.nickname;
      }

      setSelectedSlot(bookingData);
      window.location.href = "./payment.html";
    });
  }

  updateFare();
}

initPage();
