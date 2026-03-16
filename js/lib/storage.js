const BOOKINGS_KEY = "parkwise_bookings";
const SEED_BOOKINGS = [
  { id: "b1", lotName: "Central Plaza Garage", slotType: "Car", slotNumber: "A-03", vehiclePlate: "AB-123-CD", start: "Today 10:00", end: "Today 13:00", total: "$10.50", status: "Active" },
  { id: "b2", lotName: "Riverside Lot", slotType: "Car", slotNumber: "P-12", vehiclePlate: "XY-900-ZZ", start: "Mar 02 09:30", end: "Mar 02 17:00", total: "$12.00", status: "Past" },
  { id: "b3", lotName: "Airport Long Stay", slotType: "Car", slotNumber: "L-08", vehiclePlate: "AB-123-CD", start: "Feb 21 05:15", end: "Feb 23 08:10", total: "$36.00", status: "Past" },
];

export function getBookings() {
  try {
    const raw = localStorage.getItem(BOOKINGS_KEY);
    if (!raw) return [...SEED_BOOKINGS];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [...SEED_BOOKINGS];
  } catch {
    return [...SEED_BOOKINGS];
  }
}

export function saveBookings(list) {
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(list));
}

export function addBooking(booking) {
  const list = getBookings();
  const id = "b" + Date.now();
  list.unshift({ ...booking, id, status: "Active" });
  saveBookings(list);
  return id;
}

export function updateBookingById(id, updates) {
  const list = getBookings();
  const i = list.findIndex((b) => b.id === id);
  if (i === -1) return;
  list[i] = { ...list[i], ...updates };
  saveBookings(list);
}

const SELECTED_LOT_KEY = "parkwise_selected_lot";
const SELECTED_SLOT_KEY = "parkwise_selected_slot";

export function getSelectedLot() {
  try {
    const raw = sessionStorage.getItem(SELECTED_LOT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSelectedLot(lot) {
  sessionStorage.setItem(SELECTED_LOT_KEY, JSON.stringify(lot));
}

export function getSelectedSlot() {
  try {
    const raw = sessionStorage.getItem(SELECTED_SLOT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSelectedSlot(slot) {
  sessionStorage.setItem(SELECTED_SLOT_KEY, JSON.stringify(slot));
}

export function clearBookingDraft() {
  sessionStorage.removeItem(SELECTED_LOT_KEY);
  sessionStorage.removeItem(SELECTED_SLOT_KEY);
}

const USER_LOCATION_KEY = "parkwise_user_location_v1";

export function getUserLocation() {
  try {
    const raw = localStorage.getItem(USER_LOCATION_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw);
    if (!value || typeof value.lat !== "number" || typeof value.lng !== "number") return null;
    return value;
  } catch {
    return null;
  }
}

export function setUserLocation(location) {
  const lat = Number(location?.lat);
  const lng = Number(location?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
  localStorage.setItem(USER_LOCATION_KEY, JSON.stringify({ lat, lng, savedAt: Date.now() }));
}

export function clearUserLocation() {
  localStorage.removeItem(USER_LOCATION_KEY);
}

const PAYMENTS_KEY = "parkwise_payments_v1";
const INVOICES_KEY = "parkwise_invoices_v1";

export function getPayments() {
  try {
    const raw = localStorage.getItem(PAYMENTS_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function addPayment(payment) {
  const list = getPayments();
  const id = "p" + Date.now();
  const entry = { id, ...payment };
  list.unshift(entry);
  localStorage.setItem(PAYMENTS_KEY, JSON.stringify(list));
  return entry;
}

export function getInvoices() {
  try {
    const raw = localStorage.getItem(INVOICES_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function addInvoice(invoice) {
  const list = getInvoices();
  const id = "inv-" + Date.now();
  const entry = { id, ...invoice };
  list.unshift(entry);
  localStorage.setItem(INVOICES_KEY, JSON.stringify(list));
  return entry;
}
