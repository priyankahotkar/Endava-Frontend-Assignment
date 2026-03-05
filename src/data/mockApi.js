import { uid } from "../utils/uid.js";
import { clamp, hoursBetween } from "../utils/format.js";

function sleep(ms) {
  return new Promise((r) => window.setTimeout(r, ms));
}

function withLatency(fn, { min = 220, max = 650 } = {}) {
  return async (...args) => {
    const ms = Math.floor(min + Math.random() * (max - min));
    await sleep(ms);
    return fn(...args);
  };
}

function todayHours(openHour, closeHour) {
  const now = new Date();
  const d = new Date(now);
  d.setHours(openHour, 0, 0, 0);
  const start = d;
  const e = new Date(now);
  e.setHours(closeHour, 0, 0, 0);
  const end = e;
  return { start: start.toISOString(), end: end.toISOString() };
}

function seedDb() {
  const userId = "usr_demo_001";

  const lots = [
    {
      lot_id: "lot_001",
      lot_name: "Union Square Garage",
      address: "333 Post St, San Francisco",
      latitude: 37.7887,
      longitude: -122.4086,
      hourly_rate: 6.5,
      total_slots: 24,
      open_hour: 6,
      close_hour: 23,
    },
    {
      lot_id: "lot_002",
      lot_name: "Waterfront Lot",
      address: "1 Embarcadero, San Francisco",
      latitude: 37.7953,
      longitude: -122.3939,
      hourly_rate: 8.0,
      total_slots: 18,
      open_hour: 0,
      close_hour: 24,
    },
    {
      lot_id: "lot_003",
      lot_name: "Mission Street Parking",
      address: "2400 Mission St, San Francisco",
      latitude: 37.7588,
      longitude: -122.4182,
      hourly_rate: 4.75,
      total_slots: 30,
      open_hour: 7,
      close_hour: 22,
    },
  ];

  const parking_slots = lots.flatMap((lot) => {
    const slots = [];
    for (let i = 1; i <= lot.total_slots; i++) {
      const status = i % 11 === 0 ? "maintenance" : "available";
      slots.push({
        slot_id: `${lot.lot_id}_s_${String(i).padStart(2, "0")}`,
        lot_id: lot.lot_id,
        slot_number: i,
        slot_type: i % 7 === 0 ? "ev" : i % 5 === 0 ? "compact" : "standard",
        status,
      });
    }
    return slots;
  });

  const vehicles = [
    { vehicle_id: "veh_001", vehicle_type: "Sedan", vehicle_number: "CA-7XK-1203", user_id: userId },
    { vehicle_id: "veh_002", vehicle_type: "SUV", vehicle_number: "CA-3PF-4401", user_id: userId },
  ];

  const users = [
    { user_id: userId, name: "Demo User", email: "demo@parkwise.test", phone_number: "+1 (555) 012-3456", user_location: "San Francisco" },
  ];

  const bookings = [];
  const payments = [];
  const invoices = [];
  const logs = [];

  const nearby_parkings = [
    { id: uid("nearby"), lot_id: "lot_001", nearby_lot_id: "lot_002", distance_in_meters: 1650 },
    { id: uid("nearby"), lot_id: "lot_001", nearby_lot_id: "lot_003", distance_in_meters: 3100 },
    { id: uid("nearby"), lot_id: "lot_002", nearby_lot_id: "lot_001", distance_in_meters: 1650 },
  ];

  return { users, vehicles, parking_lots: lots, parking_slots, bookings, payments, invoices, logs, nearby_parkings };
}

function load(storageKey) {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function save(storageKey, db) {
  localStorage.setItem(storageKey, JSON.stringify(db));
}

function nowIso() {
  return new Date().toISOString();
}

function isOpenNow(lot) {
  if (lot.open_hour === 0 && lot.close_hour === 24) return true;
  const h = new Date().getHours();
  return h >= lot.open_hour && h < lot.close_hour;
}

function computeCost({ lot, start_time, end_time }) {
  const hours = hoursBetween(start_time, end_time);
  const billable = clamp(Math.ceil(hours * 4) / 4, 0.25, 72);
  return { hours: billable, total_cost: Number((billable * Number(lot.hourly_rate)).toFixed(2)) };
}

export function mockApi({ storageKey = "parkwise_db_v1" } = {}) {
  let db = load(storageKey) ?? seedDb();
  save(storageKey, db);

  function persist() {
    save(storageKey, db);
  }

  function writeLog(user_id, action, details) {
    db.logs.unshift({
      log_id: uid("log"),
      user_id,
      action,
      timestamp: nowIso(),
      details: typeof details === "string" ? details : JSON.stringify(details),
    });
    db.logs = db.logs.slice(0, 200);
  }

  const api = {
    reset: withLatency(() => {
      db = seedDb();
      persist();
      return { ok: true };
    }),

    getMe: withLatency((user_id) => {
      const user = db.users.find((u) => u.user_id === user_id);
      if (!user) throw new Error("User not found");
      return { user };
    }),

    listLots: withLatency(({ query = "", openNow = false, maxPrice = "" } = {}) => {
      const q = String(query || "").trim().toLowerCase();
      const max = maxPrice === "" ? null : Number(maxPrice);

      let lots = [...db.parking_lots];
      if (q) {
        lots = lots.filter((l) => `${l.lot_name} ${l.address}`.toLowerCase().includes(q));
      }
      if (openNow) {
        lots = lots.filter((l) => isOpenNow(l));
      }
      if (Number.isFinite(max)) {
        lots = lots.filter((l) => Number(l.hourly_rate) <= max);
      }

      const lotsWithStats = lots.map((lot) => {
        const slots = db.parking_slots.filter((s) => s.lot_id === lot.lot_id);
        const available = slots.filter((s) => s.status === "available").length;
        const maintenance = slots.filter((s) => s.status === "maintenance").length;
        return { ...lot, stats: { available, maintenance, total: slots.length }, open_now: isOpenNow(lot) };
      });

      return { lots: lotsWithStats };
    }),

    getLot: withLatency((lot_id) => {
      const lot = db.parking_lots.find((l) => l.lot_id === lot_id);
      if (!lot) throw new Error("Lot not found");
      const slots = db.parking_slots.filter((s) => s.lot_id === lot_id);
      const nearby = db.nearby_parkings
        .filter((n) => n.lot_id === lot_id)
        .map((n) => ({ ...n, lot: db.parking_lots.find((l) => l.lot_id === n.nearby_lot_id) }))
        .filter((n) => n.lot);
      return { lot: { ...lot, open_now: isOpenNow(lot) }, slots, nearby };
    }),

    listVehicles: withLatency((user_id) => {
      return { vehicles: db.vehicles.filter((v) => v.user_id === user_id) };
    }),

    addVehicle: withLatency((user_id, { vehicle_type, vehicle_number }) => {
      const number = String(vehicle_number || "").trim();
      if (!number) throw new Error("Vehicle number is required");
      if (db.vehicles.some((v) => v.vehicle_number.toLowerCase() === number.toLowerCase())) {
        throw new Error("Vehicle number already exists");
      }
      const vehicle = {
        vehicle_id: uid("veh"),
        vehicle_type: String(vehicle_type || "Vehicle").trim() || "Vehicle",
        vehicle_number: number,
        user_id,
      };
      db.vehicles.unshift(vehicle);
      writeLog(user_id, "vehicle.added", vehicle);
      persist();
      return { vehicle };
    }),

    removeVehicle: withLatency((user_id, vehicle_id) => {
      const idx = db.vehicles.findIndex((v) => v.vehicle_id === vehicle_id && v.user_id === user_id);
      if (idx < 0) throw new Error("Vehicle not found");
      const [removed] = db.vehicles.splice(idx, 1);
      writeLog(user_id, "vehicle.removed", removed);
      persist();
      return { ok: true };
    }),

    quoteBooking: withLatency((user_id, { lot_id, slot_id, vehicle_id, start_time, end_time }) => {
      const lot = db.parking_lots.find((l) => l.lot_id === lot_id);
      if (!lot) throw new Error("Lot not found");
      const slot = db.parking_slots.find((s) => s.slot_id === slot_id && s.lot_id === lot_id);
      if (!slot) throw new Error("Slot not found");
      if (slot.status !== "available") throw new Error("Slot not available");
      const vehicle = db.vehicles.find((v) => v.vehicle_id === vehicle_id && v.user_id === user_id);
      if (!vehicle) throw new Error("Vehicle not found");

      const start = new Date(start_time);
      const end = new Date(end_time);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) throw new Error("Invalid time range");

      const { hours, total_cost } = computeCost({ lot, start_time, end_time });
      return { quote: { hours, total_cost, hourly_rate: lot.hourly_rate } };
    }),

    createBooking: withLatency((user_id, { lot_id, slot_id, vehicle_id, start_time, end_time }) => {
      const lot = db.parking_lots.find((l) => l.lot_id === lot_id);
      if (!lot) throw new Error("Lot not found");
      const slot = db.parking_slots.find((s) => s.slot_id === slot_id && s.lot_id === lot_id);
      if (!slot) throw new Error("Slot not found");
      if (slot.status !== "available") throw new Error("Slot not available");
      const vehicle = db.vehicles.find((v) => v.vehicle_id === vehicle_id && v.user_id === user_id);
      if (!vehicle) throw new Error("Vehicle not found");

      const start = new Date(start_time);
      const end = new Date(end_time);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) throw new Error("Invalid time range");

      const { total_cost } = computeCost({ lot, start_time, end_time });
      const booking = {
        booking_id: uid("bkg"),
        user_id,
        vehicle_id,
        slot_id,
        start_time: new Date(start).toISOString(),
        end_time: new Date(end).toISOString(),
        booking_status: "pending_payment",
        total_cost,
      };

      slot.status = "occupied";
      db.bookings.unshift(booking);
      writeLog(user_id, "booking.created", booking);
      persist();
      return { booking };
    }),

    listBookings: withLatency((user_id) => {
      const byId = new Map(db.parking_lots.map((l) => [l.lot_id, l]));
      const slotsById = new Map(db.parking_slots.map((s) => [s.slot_id, s]));
      const vehiclesById = new Map(db.vehicles.map((v) => [v.vehicle_id, v]));
      const bookings = db.bookings
        .filter((b) => b.user_id === user_id)
        .map((b) => {
          const slot = slotsById.get(b.slot_id);
          const lot = slot ? byId.get(slot.lot_id) : null;
          const vehicle = vehiclesById.get(b.vehicle_id) ?? null;
          return { ...b, slot, lot, vehicle };
        });
      return { bookings };
    }),

    cancelBooking: withLatency((user_id, booking_id) => {
      const booking = db.bookings.find((b) => b.booking_id === booking_id && b.user_id === user_id);
      if (!booking) throw new Error("Booking not found");
      if (booking.booking_status === "cancelled") return { booking };

      booking.booking_status = "cancelled";
      const slot = db.parking_slots.find((s) => s.slot_id === booking.slot_id);
      if (slot && slot.status === "occupied") slot.status = "available";
      writeLog(user_id, "booking.cancelled", { booking_id });
      persist();
      return { booking };
    }),

    payForBooking: withLatency((user_id, booking_id, { payment_method = "card" } = {}) => {
      const booking = db.bookings.find((b) => b.booking_id === booking_id && b.user_id === user_id);
      if (!booking) throw new Error("Booking not found");
      if (booking.booking_status === "cancelled") throw new Error("Booking cancelled");

      const payment = {
        payment_id: uid("pay"),
        booking_id,
        payment_method,
        amount: booking.total_cost,
        payment_status: "paid",
        payment_time: nowIso(),
      };
      db.payments.unshift(payment);

      const invoice = {
        invoice_id: uid("inv"),
        booking_id,
        invoice_date: nowIso(),
        total_amount: booking.total_cost,
        status: "issued",
      };
      db.invoices.unshift(invoice);

      booking.booking_status = "confirmed";
      writeLog(user_id, "payment.paid", payment);
      persist();
      return { booking, payment, invoice };
    }),

    listBilling: withLatency((user_id) => {
      const bookings = db.bookings.filter((b) => b.user_id === user_id);
      const bookingIds = new Set(bookings.map((b) => b.booking_id));
      return {
        payments: db.payments.filter((p) => bookingIds.has(p.booking_id)),
        invoices: db.invoices.filter((i) => bookingIds.has(i.booking_id)),
      };
    }),

    stats: withLatency((user_id) => {
      const { start, end } = todayHours(0, 24);
      const my = db.bookings.filter((b) => b.user_id === user_id);
      const active = my.filter((b) => b.booking_status === "confirmed" || b.booking_status === "pending_payment").length;
      const openLots = db.parking_lots.filter((l) => isOpenNow(l)).length;
      const totalLots = db.parking_lots.length;
      return { stats: { totalLots, openLots, activeBookings: active, today: { start, end } } };
    }),
  };

  return api;
}

