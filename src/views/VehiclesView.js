import { el } from "../utils/dom.js";
import { EmptyState } from "../components/ui/Empty.js";
import { LoadingBlock, ErrorBlock, sectionHead } from "./_shared.js";

export function VehiclesView({ api, store, toastHost }) {
  const userId = store.getState().session.userId;
  const root = el("div", { class: "section" }, el("div", { class: "container" }, LoadingBlock().el));
  let alive = true;

  async function load() {
    try {
      const { vehicles } = await api.listVehicles(userId);
      if (!alive) return;
      render({ vehicles });
      store.log("vehicles.viewed", { count: vehicles.length });
    } catch (e) {
      if (!alive) return;
      toastHost.push({ title: "Couldn’t load vehicles", message: e?.message || "Try again.", tone: "danger" });
      root.replaceChildren(el("div", { class: "container" }, ErrorBlock({ message: "Mock API error while loading vehicles." }).el));
    }
  }

  function render({ vehicles }) {
    const type = el("input", { class: "control", placeholder: "e.g. Sedan, SUV", value: "" });
    const number = el("input", { class: "control", placeholder: "e.g. CA-7XK-1203", value: "" });
    const addBtn = el("button", { class: "btn primary", type: "button" }, "Add vehicle");

    addBtn.addEventListener("click", async () => {
      addBtn.disabled = true;
      try {
        const { vehicle } = await api.addVehicle(userId, { vehicle_type: type.value, vehicle_number: number.value });
        toastHost.push({ title: "Vehicle added", message: `${vehicle.vehicle_type} • ${vehicle.vehicle_number}`, tone: "success" });
        type.value = "";
        number.value = "";
        load();
      } catch (e) {
        toastHost.push({ title: "Couldn’t add vehicle", message: e?.message || "Try again.", tone: "danger" });
      } finally {
        addBtn.disabled = false;
      }
    });

    const form = el(
      "div",
      { class: "card", style: { gridColumn: "span 5" } },
      el(
        "div",
        { class: "card-body" },
        el("h3", { class: "card-title" }, "Add a vehicle"),
        el("p", { class: "card-meta" }, "Vehicle numbers are used when creating bookings."),
        el("div", { class: "form", style: { marginTop: "12px" } }, field("Type", type), field("Number", number), addBtn),
      ),
    );

    const list =
      vehicles.length === 0
        ? EmptyState({
            title: "No vehicles yet",
            message: "Add one to start booking slots.",
          }).el
        : vehiclesTable(vehicles);

    const listCard = el(
      "div",
      { class: "card", style: { gridColumn: "span 7" } },
      el(
        "div",
        { class: "card-body" },
        el("h3", { class: "card-title" }, "Your vehicles"),
        el("p", { class: "card-meta" }, "Stored in localStorage (mock)."),
        el("div", { style: { marginTop: "10px", overflowX: "auto" } }, list),
      ),
    );

    const container = el(
      "div",
      { class: "container" },
      sectionHead({ title: "Vehicles", subtitle: "Manage the vehicles associated with your user." }),
      el("div", { class: "grid" }, form, listCard),
    );
    root.replaceChildren(container);
  }

  function vehiclesTable(vehicles) {
    const tbody = el(
      "tbody",
      {},
      ...vehicles.map((v) => {
        const removeBtn = el("button", { class: "btn small danger", type: "button" }, "Remove");
        removeBtn.addEventListener("click", async () => {
          removeBtn.disabled = true;
          try {
            await api.removeVehicle(userId, v.vehicle_id);
            toastHost.push({ title: "Vehicle removed", message: v.vehicle_number, tone: "success" });
            load();
          } catch (e) {
            toastHost.push({ title: "Couldn’t remove", message: e?.message || "Try again.", tone: "danger" });
          } finally {
            removeBtn.disabled = false;
          }
        });

        return el(
          "tr",
          {},
          el("td", {}, v.vehicle_type),
          el("td", { style: { fontWeight: 800 } }, v.vehicle_number),
          el("td", { class: "mono" }, v.vehicle_id),
          el("td", {}, removeBtn),
        );
      }),
    );

    return el(
      "table",
      { class: "table" },
      el("thead", {}, el("tr", {}, el("th", {}, "Type"), el("th", {}, "Number"), el("th", {}, "ID"), el("th", {}, ""))),
      tbody,
    );
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

