import { el } from "../utils/dom.js";
import { EmptyState } from "../components/ui/Empty.js";
import { formatMoney } from "../utils/format.js";
import { LoadingBlock, ErrorBlock, sectionHead } from "./_shared.js";

function toLocalInputValue(iso) {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function localInputToIso(v) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}

export function LotDetailsView({ api, store, toastHost }, params) {
  const userId = store.getState().session.userId;
  const lotId = params?.lotId;
  const root = el("div", { class: "section" }, el("div", { class: "container" }, LoadingBlock().el));
  let alive = true;

  async function load() {
    try {
      const [{ lot, slots, nearby }, { vehicles }] = await Promise.all([api.getLot(lotId), api.listVehicles(userId)]);
      if (!alive) return;
      render({ lot, slots, nearby, vehicles });
      store.log("lot.viewed", { lot_id: lotId });
    } catch (e) {
      if (!alive) return;
      toastHost.push({ title: "Couldn’t load lot", message: e?.message || "Try again.", tone: "danger" });
      root.replaceChildren(el("div", { class: "container" }, ErrorBlock({ message: "Mock API error while loading the lot." }).el));
    }
  }

  function render({ lot, slots, nearby, vehicles }) {
    const availableSlots = slots.filter((s) => s.status === "available");

    const headerRight = el(
      "div",
      { style: { display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "flex-end" } },
      el("a", { class: "btn", href: "#/lots" }, "Back to lots"),
      el("a", { class: "btn primary", href: "#/bookings" }, "My bookings"),
    );

    const top = sectionHead({
      title: lot.lot_name,
      subtitle: `${lot.address} • ${formatMoney(lot.hourly_rate)} / hour`,
      right: headerRight,
    });

    const infoCard = el(
      "div",
      { class: "card", style: { gridColumn: "span 7" } },
      el(
        "div",
        { class: "card-body" },
        el("h3", { class: "card-title" }, "Lot details"),
        el(
          "div",
          { class: "pill-row" },
          lot.open_now ? el("span", { class: "pill" }, el("span", { class: "dot success" }), "Open now") : el("span", { class: "pill" }, el("span", { class: "dot warning" }), "Closed"),
          el("span", { class: "pill" }, el("span", { class: "dot success" }), `${availableSlots.length} available`),
          el("span", { class: "pill" }, el("span", { class: "dot" }), `${slots.length} total`),
        ),
        el(
          "div",
          { style: { marginTop: "12px", display: "grid", gap: "8px" } },
          el("div", { class: "card-meta" }, `Hours: ${String(lot.open_hour).padStart(2, "0")}:00 — ${String(lot.close_hour).padStart(2, "0")}:00`),
          el("div", { class: "card-meta" }, `Coordinates: ${lot.latitude}, ${lot.longitude}`),
        ),
      ),
    );

    const nearbyCard = el(
      "div",
      { class: "card", style: { gridColumn: "span 5" } },
      el(
        "div",
        { class: "card-body" },
        el("h3", { class: "card-title" }, "Nearby alternatives"),
        nearby.length === 0
          ? el("p", { class: "card-meta" }, "No nearby lots in mock data.")
          : el(
              "div",
              { style: { display: "grid", gap: "10px", marginTop: "10px" } },
              ...nearby.map((n) =>
                el(
                  "div",
                  { class: "stat" },
                  el("div", { class: "k" }, n.lot.lot_name),
                  el("div", { class: "v", style: { fontSize: "14px", fontWeight: 850 } }, `${n.distance_in_meters} m`),
                ),
              ),
            ),
      ),
    );

    const bookingCard = bookingFormCard({ lot, availableSlots, vehicles });
    const slotsCard = slotsListCard({ slots });

    const grid = el("div", { class: "grid" }, infoCard, nearbyCard, bookingCard, slotsCard);

    const container = el("div", { class: "container" }, top, grid);
    root.replaceChildren(container);
  }

  function bookingFormCard({ lot, availableSlots, vehicles }) {
    const vehicleSel = el("select", { class: "control" }, ...vehicles.map((v) => el("option", { value: v.vehicle_id }, `${v.vehicle_type} • ${v.vehicle_number}`)));
    const slotSel = el(
      "select",
      { class: "control" },
      ...availableSlots.slice(0, 30).map((s) => el("option", { value: s.slot_id }, `#${s.slot_number} • ${s.slot_type.toUpperCase()}`)),
    );

    const start = el("input", { class: "control", type: "datetime-local", value: toLocalInputValue(new Date().toISOString()) });
    const end = el("input", { class: "control", type: "datetime-local", value: toLocalInputValue(new Date(Date.now() + 60 * 60 * 1000).toISOString()) });

    const quoteLine = el("div", { class: "card-meta" }, "Quote: —");
    const submit = el("button", { class: "btn primary block", type: "button", disabled: vehicles.length === 0 || availableSlots.length === 0 }, "Create booking");

    const addVehicleHint =
      vehicles.length === 0
        ? EmptyState({
            title: "Add a vehicle first",
            message: "Bookings require a vehicle number. Add one, then come back.",
            action: { el: el("a", { class: "btn small", href: "#/vehicles" }, "Go to vehicles") },
          }).el
        : null;

    const noSlotsHint =
      availableSlots.length === 0
        ? EmptyState({
            title: "No available slots",
            message: "In mock data, all slots are occupied or under maintenance right now.",
            action: { el: el("a", { class: "btn small", href: "#/lots" }, "Pick another lot") },
          }).el
        : null;

    async function refreshQuote() {
      if (vehicles.length === 0 || availableSlots.length === 0) return;
      try {
        const startIso = localInputToIso(start.value);
        const endIso = localInputToIso(end.value);
        const { quote } = await api.quoteBooking(store.getState().session.userId, {
          lot_id: lot.lot_id,
          slot_id: slotSel.value,
          vehicle_id: vehicleSel.value,
          start_time: startIso,
          end_time: endIso,
        });
        quoteLine.textContent = `Quote: ${formatMoney(quote.total_cost)} • ${quote.hours} hrs @ ${formatMoney(quote.hourly_rate)}/hr`;
      } catch (e) {
        quoteLine.textContent = `Quote: — (${e?.message || "invalid"})`;
      }
    }

    vehicleSel.addEventListener("change", refreshQuote);
    slotSel.addEventListener("change", refreshQuote);
    start.addEventListener("change", refreshQuote);
    end.addEventListener("change", refreshQuote);

    submit.addEventListener("click", async () => {
      submit.disabled = true;
      try {
        const startIso = localInputToIso(start.value);
        const endIso = localInputToIso(end.value);
        const { booking } = await api.createBooking(store.getState().session.userId, {
          lot_id: lot.lot_id,
          slot_id: slotSel.value,
          vehicle_id: vehicleSel.value,
          start_time: startIso,
          end_time: endIso,
        });

        toastHost.push({ title: "Booking created", message: `Status: ${booking.booking_status}. Next: pay to confirm.`, tone: "success" });
        window.location.hash = "#/bookings";
      } catch (e) {
        toastHost.push({ title: "Booking failed", message: e?.message || "Try again.", tone: "danger" });
      } finally {
        submit.disabled = false;
      }
    });

    const form = el(
      "div",
      { class: "form" },
      el("div", { class: "form-row" }, field("Vehicle", vehicleSel), field("Slot", slotSel)),
      el("div", { class: "form-row" }, field("Start time", start), field("End time", end)),
      el("div", {}, quoteLine),
      submit,
    );

    const extra = addVehicleHint || noSlotsHint;

    const card = el(
      "div",
      { class: "card", style: { gridColumn: "span 7" } },
      el(
        "div",
        { class: "card-body" },
        el("h3", { class: "card-title" }, "Book a slot"),
        el("p", { class: "card-meta" }, "Create a pending booking, then confirm it from Bookings by paying via mock checkout."),
        extra ? el("div", { style: { marginTop: "12px" } }, extra) : el("div", { style: { marginTop: "12px" } }, form),
      ),
    );

    refreshQuote();
    return card;
  }

  function slotsListCard({ slots }) {
    const rows = slots
      .slice()
      .sort((a, b) => a.slot_number - b.slot_number)
      .slice(0, 24)
      .map((s) => {
        const badgeClass = s.status === "available" ? "success" : s.status === "maintenance" ? "warning" : "danger";
        return el(
          "tr",
          {},
          el("td", {}, `#${s.slot_number}`),
          el("td", {}, s.slot_type.toUpperCase()),
          el("td", {}, el("span", { class: `badge ${badgeClass}` }, s.status.replace("_", " "))),
          el("td", { class: "mono" }, s.slot_id),
        );
      });

    const table = el(
      "table",
      { class: "table" },
      el("thead", {}, el("tr", {}, el("th", {}, "Slot"), el("th", {}, "Type"), el("th", {}, "Status"), el("th", {}, "ID"))),
      el("tbody", {}, ...rows),
    );

    const card = el(
      "div",
      { class: "card", style: { gridColumn: "span 5" } },
      el(
        "div",
        { class: "card-body" },
        el("h3", { class: "card-title" }, "Slots (sample)"),
        el("p", { class: "card-meta" }, "Showing the first 24 slots for quick scanning."),
        el("div", { style: { marginTop: "10px", overflowX: "auto" } }, table),
      ),
    );
    return card;
  }

  function field(label, control) {
    return el("div", { class: "field" }, el("label", {}, label), control);
  }

  load();

  return {
    el: root,
    cleanup() {
      alive = false;
    },
  };
}

