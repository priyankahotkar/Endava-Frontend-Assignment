import { el } from "../utils/dom.js";

export function ToastHost() {
  const host = el("div", { class: "toast-host", role: "status", "aria-live": "polite" });

  function push({ title, message, tone = "neutral", durationMs = 3600 } = {}) {
    const tTitle = el("p", { class: "t-title" }, title || "Notice");
    const tMsg = el("p", { class: "t-msg" }, message || "");
    const closeBtn = el("button", { class: "btn small ghost", type: "button" }, "Dismiss");

    const toast = el(
      "div",
      { class: "toast", "data-tone": tone },
      el("div", {}, tTitle, tMsg),
      closeBtn,
    );

    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      toast.remove();
    };

    closeBtn.addEventListener("click", close);
    host.appendChild(toast);

    window.setTimeout(close, durationMs);
    return { close };
  }

  return { el: host, push };
}

