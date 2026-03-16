import { query, on } from "../lib/dom.js";
import { emit } from "../lib/events.js";
import { TOAST_EVENT } from "./toast.js";
import { getVehicles, addVehicle } from "../lib/storage.js";

const FORM_SELECTOR = "[data-form=\"add-vehicle\"]";
const LIST_SELECTOR = "[data-vehicle-list]";
const PLATE_MIN_LENGTH = 2;

function getFormData(form) {
  const fd = new FormData(form);
  return Object.fromEntries(
    Array.from(fd.entries()).filter(([, v]) => v != null && String(v).trim() !== "")
  );
}

function validatePlate(value) {
  const trimmed = (value || "").trim();
  return trimmed.length >= PLATE_MIN_LENGTH;
}

function buildTableRow(vehicle) {
  const tr = document.createElement("tr");
  const plate = (vehicle.plate || "").trim();
  const nickname = (vehicle.nickname || "").trim() || "—";
  const type = vehicle.type || "—";
  let status = vehicle.status || "New";

  let badgeClass = "badge--warning";
  if (status === "Default") badgeClass = "badge--success";
  else if (status === "Secondary") badgeClass = "badge--warning";

  tr.innerHTML = `
    <td class="mono">${escapeHtml(plate)}</td>
    <td>${escapeHtml(nickname)}</td>
    <td>${escapeHtml(type)}</td>
    <td><span class="badge ${badgeClass}">${escapeHtml(status)}</span></td>
  `;

  return tr;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function handleSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const list = query(LIST_SELECTOR, form.closest(".app-shell") || document);
  if (!list) return;

  const data = getFormData(form);

  if (!validatePlate(data.plate)) {
    emit(TOAST_EVENT, { message: "Please enter a plate number.", type: "error" });
    return;
  }

  // Save to local storage
  addVehicle({
    plate: data.plate,
    nickname: data.nickname,
    type: data.type,
    status: "New"
  });

  // Re-render list
  renderVehicleList(list);
  form.reset();

  emit(TOAST_EVENT, { message: "Vehicle added.", type: "success" });
}

function renderVehicleList(listElem) {
  const vehicles = getVehicles();
  listElem.innerHTML = "";

  vehicles.forEach(vehicle => {
    listElem.appendChild(buildTableRow(vehicle));
  });
}

export function init(root = document) {
  const form = root.querySelector(FORM_SELECTOR);
  const list = root.querySelector(LIST_SELECTOR);

  if (list) {
    renderVehicleList(list);
  }

  if (form) {
    on(form, "submit", handleSubmit);
  }
}