import { query, on } from "../lib/dom.js";
import { show as showModal } from "./modal.js";
import { emit } from "../lib/events.js";
import { TOAST_EVENT } from "./toast.js";

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
  const button = root.querySelector(BUTTON_SELECTOR);
  if (!button) return;
  on(button, "click", handleUpdatePaymentClick);
}
