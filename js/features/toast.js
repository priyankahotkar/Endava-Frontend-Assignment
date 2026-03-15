import { query, on } from "../lib/dom.js";
import { on as subscribe } from "../lib/events.js";

const TOAST_EVENT = "parkwise:toast";
const HOST_CLASS = "toast-host";
const TOAST_CLASS = "toast";
const AUTO_CLOSE_MS = 4000;

function ensureHost() {
  let host = query(`.${HOST_CLASS}`);
  if (!host) {
    host = document.createElement("div");
    host.className = HOST_CLASS;
    host.setAttribute("aria-live", "polite");
    document.body.appendChild(host);
  }
  return host;
}

function showToast(message, type = "info") {
  const host = ensureHost();
  const toast = document.createElement("div");
  toast.className = `${TOAST_CLASS} toast--${type}`;
  toast.setAttribute("role", "status");
  toast.textContent = message;
  host.appendChild(toast);
  const remove = () => {
    toast.remove();
  };
  const timer = setTimeout(remove, AUTO_CLOSE_MS);
  toast.addEventListener("click", () => {
    clearTimeout(timer);
    remove();
  });
}

export function init() {
  subscribe(TOAST_EVENT, ({ message, type }) => showToast(message, type));
}

export function toast(message, type = "info") {
  showToast(message, type);
}

export { TOAST_EVENT };
