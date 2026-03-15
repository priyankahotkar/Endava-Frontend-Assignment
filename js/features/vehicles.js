import { query, on } from "../lib/dom.js";
import { emit } from "../lib/events.js";
import { TOAST_EVENT } from "./toast.js";

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
  tr.innerHTML = `
    <td class="mono">${escapeHtml(plate)}</td>
    <td>${escapeHtml(nickname)}</td>
    <td>${escapeHtml(type)}</td>
    <td><span class="badge badge--warning">New</span></td>
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

  const row = buildTableRow({
    plate: data.plate,
    nickname: data.nickname,
    type: data.type,
  });
  list.appendChild(row);
  form.reset();
  emit(TOAST_EVENT, { message: "Vehicle added.", type: "success" });
}

export function init(root = document) {
  const form = root.querySelector(FORM_SELECTOR);
  if (!form) return;
  on(form, "submit", handleSubmit);
}
