import { query, on } from "../lib/dom.js";
import { show as showModal } from "./modal.js";
import { emit } from "../lib/events.js";
import { TOAST_EVENT } from "./toast.js";
import { getInvoices, getPayments } from "../lib/storage.js";

const BUTTON_SELECTOR = "[data-action=\"update-payment\"]";

const PAYMENT_FORM_HTML = `
  <form class="form" data-modal-form="payment">
    <div class="field">
      <label for="modal-card">Card number (last 4 digits)</label>
      <input id="modal-card" name="card" class="control" type="text" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" placeholder="4242" required />
    </div>
    <div class="field">
      <label for="modal-expiry">Expiry (MM/YY)</label>
      <input id="modal-expiry" name="expiry" class="control" type="text" placeholder="09/28" maxlength="5" required />
    </div>
  </form>
`;

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function renderInvoices(root = document) {
  const tbody = root.querySelector("[data-invoices-list]");
  if (!tbody) return;
  const invoices = getInvoices();
  tbody.innerHTML = invoices
    .map(
      (inv) =>
        `<tr>
          <td class="mono">${escapeHtml(inv.id || "")}</td>
          <td>${escapeHtml(inv.date || "")}</td>
          <td>${escapeHtml(inv.amount || "")}</td>
          <td><span class="badge badge--${inv.status === "Paid" ? "success" : "warning"}">${escapeHtml(
            inv.status || ""
          )}</span></td>
        </tr>`
    )
    .join("");
}

function renderLatestPaymentSummary(root = document) {
  const summary = root.querySelector("[data-payment-summary]");
  if (!summary) return;
  const payments = getPayments();
  if (!payments.length) {
    summary.innerHTML = `
      <div class="payment-summary-title">Card ending —</div>
      <div>Expires —</div>
    `;
    return;
  }
  const latest = payments[0];
  const last4 = latest.cardLast4 || "—";
  summary.innerHTML = `
    <div class="payment-summary-title">Card ending ${escapeHtml(last4)}</div>
    <div>${escapeHtml(latest.paidAt || "")}</div>
  `;
}

function handleUpdatePaymentClick(event) {
  const button = event.target.closest(BUTTON_SELECTOR);
  if (!button) return;

  showModal({
    title: "Update payment method",
    body: PAYMENT_FORM_HTML,
    primaryLabel: "Save",
    secondaryLabel: "Cancel",
    onPrimary: () => {
      const form = document.querySelector("[data-modal-form=\"payment\"]");
      if (!form) return true;
      const card = form.querySelector("[name=\"card\"]")?.value?.trim();
      const expiry = form.querySelector("[name=\"expiry\"]")?.value?.trim();
      if (!card || card.length !== 4) {
        emit(TOAST_EVENT, { message: "Enter a valid 4-digit card number.", type: "error" });
        return false;
      }
      emit(TOAST_EVENT, { message: "Payment method updated.", type: "success" });
    },
  });
}

export function init(root = document) {
  renderInvoices(root);
  renderLatestPaymentSummary(root);
  const button = root.querySelector(BUTTON_SELECTOR);
  if (button) on(button, "click", handleUpdatePaymentClick);
}
