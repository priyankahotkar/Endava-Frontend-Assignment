import { el, clearFocus } from "../../utils/dom.js";

export function Modal({ title, content, actions = [], onClose }) {
  const backdrop = el("div", { class: "modal-backdrop" });
  const dialog = el("div", {
    class: "modal",
    role: "dialog",
    "aria-modal": "true",
    "aria-label": title || "Dialog",
  });

  const closeBtn = el("button", { class: "btn small ghost", type: "button" }, "Close");
  closeBtn.addEventListener("click", () => api.close());

  const head = el("div", { class: "modal-head" }, el("h3", {}, title || "Dialog"), closeBtn);
  const body = el("div", { class: "modal-body" }, content instanceof Node ? content : el("div", {}, String(content ?? "")));
  const foot = el("div", { class: "modal-foot" });

  for (const a of actions) {
    const btn = el(
      "button",
      { class: `btn ${a.variant || "ghost"}`, type: "button", disabled: !!a.disabled },
      a.label || "Action",
    );
    btn.addEventListener("click", () => a.onClick?.(api));
    foot.appendChild(btn);
  }

  dialog.append(head, body, foot);
  backdrop.appendChild(dialog);

  function onKeyDown(e) {
    if (e.key === "Escape") api.close();
  }

  function onBackdropClick(e) {
    if (e.target === backdrop) api.close();
  }

  backdrop.addEventListener("click", onBackdropClick);
  window.addEventListener("keydown", onKeyDown);

  const api = {
    el: backdrop,
    close() {
      clearFocus();
      window.removeEventListener("keydown", onKeyDown);
      backdrop.remove();
      onClose?.();
    },
  };

  return api;
}

