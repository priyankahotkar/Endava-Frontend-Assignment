import { getSelectedLot, getSelectedSlot, addBooking, clearBookingDraft } from "./lib/storage.js";

function getTodayTime(offsetHours) {
  const d = new Date();
  d.setHours(d.getHours() + offsetHours);
  const h = d.getHours();
  const m = d.getMinutes();
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function getTodayLabel() {
  const d = new Date();
  const mon = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()];
  return `Today ${d.getDate()} ${mon}`;
}

function initPaymentPage() {
  const lot = getSelectedLot();
  const slot = getSelectedSlot();

  if (!lot || !slot) {
    window.location.href = "./lots.html";
    return;
  }

  const lotNameEl = document.getElementById("pay-lot-name");
  const slotDetailEl = document.getElementById("pay-slot-detail");
  const durationEl = document.getElementById("pay-duration");
  const amountEl = document.getElementById("pay-amount");

  if (lotNameEl) lotNameEl.textContent = lot.name;
  if (slotDetailEl) slotDetailEl.textContent = `${slot.slotType} · ${slot.slotNumber}`;
  if (durationEl) durationEl.textContent = `${slot.durationHours || 3} hours`;
  if (amountEl) amountEl.textContent = `$${slot.fare || "0.00"}`;

  const form = document.querySelector("[data-payment-form]");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const cardNumber = form.querySelector("[name=\"cardNumber\"]")?.value?.replace(/\s/g, "") || "";
    const expiry = form.querySelector("[name=\"expiry\"]")?.value?.trim() || "";
    const cvv = form.querySelector("[name=\"cvv\"]")?.value?.trim() || "";
    const name = form.querySelector("[name=\"name\"]")?.value?.trim() || "";

    if (cardNumber.length < 13) {
      return;
    }
    if (!expiry || !cvv || !name) {
      return;
    }

    const btn = document.getElementById("pay-button");
    if (btn) btn.disabled = true;

    setTimeout(() => {
      const startTime = getTodayTime(0);
      const endTime = getTodayTime(slot.durationHours || 3);
      const dateLabel = getTodayLabel();

      addBooking({
        lotName: lot.name,
        slotType: slot.slotType,
        slotNumber: slot.slotNumber,
        vehiclePlate: "AB-123-CD",
        start: `${dateLabel} ${startTime}`,
        end: `${dateLabel} ${endTime}`,
        total: `$${slot.fare || "0.00"}`,
        status: "Active",
      });

      clearBookingDraft();
      window.location.href = "./bookings.html?paid=1";
    }, 800);
  });
}

initPaymentPage();
