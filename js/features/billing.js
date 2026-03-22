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

function formatDateDisplay(dateStr) {
  if (!dateStr) return "";
  
  // Handle different date formats:
  // 1. "17 Mar 2026" (new format: day month year)
  // 2. "Today" (current day format)
  // 3. "Today 17 Mar" (old format: Today day month)
  // 4. "Mar 02" (old format: month day, assume current year)
  
  const parts = dateStr.split(" ");
  
  if (parts.length === 3 && parts[0] === "Today") {
    // Format: "Today 17 Mar" - old format with Today prefix
    const day = parts[1];
    const month = parts[2];
    const currentYear = new Date().getFullYear();
    const fullDateStr = `${day} ${month} ${currentYear}`;
    
    const today = new Date();
    const todayStr = `${today.getDate()} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][today.getMonth()]} ${today.getFullYear()}`;
    
    if (fullDateStr === todayStr) {
      return `Today`;
    }
    return fullDateStr;
  } else if (parts.length === 3) {
    // Format: "17 Mar 2026"
    const day = parts[0];
    const month = parts[1];
    const year = parts[2];
    const fullDateStr = `${day} ${month} ${year}`;
    
    const today = new Date();
    const todayStr = `${today.getDate()} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][today.getMonth()]} ${today.getFullYear()}`;
    
    if (fullDateStr === todayStr) {
      return `Today`;
    }
    return dateStr;
  } else if (parts.length === 1 && parts[0] === "Today") {
    // Format: "Today" - this is already correctly formatted for today
    return dateStr;
  } else if (parts.length === 2) {
    // Format: "Mar 02" - old format, assume current year
    const month = parts[0];
    const day = parts[1];
    const currentYear = new Date().getFullYear();
    const fullDateStr = `${day} ${month} ${currentYear}`;
    
    const today = new Date();
    const todayStr = `${today.getDate()} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][today.getMonth()]} ${today.getFullYear()}`;
    
    if (fullDateStr === todayStr) {
      return `Today`;
    }
    return `${fullDateStr}`;
  }
  
  // Fallback: return as-is
  return dateStr;
}

function formatDateTimeDisplay(dateTimeStr) {
  if (!dateTimeStr) return "";
  
  // Handle different date-time formats:
  // 1. "17 Mar 2026 10:00" (new format: day month year time)
  // 2. "Today 10:00" (current day format)
  // 3. "Today 17 Mar 10:00" (old format: Today day month time)
  // 4. "Today 17 Mar" (old format: Today day month, assume current time)
  // 5. "Mar 02 09:30" (old format: month day time)
  
  const parts = dateTimeStr.split(" ");
  
  if (parts.length === 4 && parts[0] === "Today") {
    // Format: "Today 17 Mar 10:00" - old format with Today prefix
    const day = parts[1];
    const month = parts[2];
    const time = parts[3];
    const currentYear = new Date().getFullYear();
    const dateStr = `${day} ${month} ${currentYear}`;
    
    const today = new Date();
    const todayStr = `${today.getDate()} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][today.getMonth()]} ${today.getFullYear()}`;
    
    if (dateStr === todayStr) {
      return `Today ${time}`;
    }
    return `${dateStr} ${time}`;
  } else if (parts.length === 3 && parts[0] === "Today") {
    // Format: "Today 17 Mar" - old format with Today prefix, no time
    const day = parts[1];
    const month = parts[2];
    const currentYear = new Date().getFullYear();
    const dateStr = `${day} ${month} ${currentYear}`;
    
    const today = new Date();
    const todayStr = `${today.getDate()} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][today.getMonth()]} ${today.getFullYear()}`;
    
    if (dateStr === todayStr) {
      return `Today`;
    }
    return dateStr;
  } else if (parts.length === 4) {
    // Format: "17 Mar 2026 10:00" - new format
    const day = parts[0];
    const month = parts[1];
    const year = parts[2];
    const time = parts[3];
    const dateStr = `${day} ${month} ${year}`;
    
    const today = new Date();
    const todayStr = `${today.getDate()} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][today.getMonth()]} ${today.getFullYear()}`;
    
    if (dateStr === todayStr) {
      return `Today ${time}`;
    }
    return dateTimeStr;
  } else if (parts.length === 2 && parts[0] === "Today") {
    // Format: "Today 10:00" - this is already correctly formatted for today
    return dateTimeStr;
  } else if (parts.length === 3) {
    // Format: "Mar 02 09:30" - old format, assume current year
    const month = parts[0];
    const day = parts[1];
    const time = parts[2];
    const currentYear = new Date().getFullYear();
    const dateStr = `${day} ${month} ${currentYear}`;
    
    const today = new Date();
    const todayStr = `${today.getDate()} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][today.getMonth()]} ${today.getFullYear()}`;
    
    if (dateStr === todayStr) {
      return `Today ${time}`;
    }
    return `${dateStr} ${time}`;
  }
  
  // Fallback: return as-is
  return dateTimeStr;
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
          <td>${escapeHtml(formatDateDisplay(inv.date || ""))}</td>
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
    <div>${escapeHtml(formatDateTimeDisplay(latest.paidAt || ""))}</div>
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
