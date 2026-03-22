import { on } from "../lib/dom.js";

let activeBackdrop = null;

function createModal(config) {
  const {
    title = "",
    body = "",
    primaryLabel = "Confirm",
    secondaryLabel = "Cancel",
    onPrimary,
    onSecondary,
    hideSecondary = false,
  } = config;

  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.setAttribute("role", "dialog");
  backdrop.setAttribute("aria-modal", "true");
  backdrop.setAttribute("aria-labelledby", "modal-title");

  const modal = document.createElement("div");
  modal.className = "modal";

  const head = document.createElement("div");
  head.className = "modal-head";
  const titleEl = document.createElement("h3");
  titleEl.id = "modal-title";
  titleEl.textContent = title;
  
  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "btn modal-close-btn";
  closeBtn.setAttribute("aria-label", "Close modal");
  closeBtn.innerHTML = "×";
  closeBtn.addEventListener("click", () => close());
  
  head.appendChild(titleEl);
  head.appendChild(closeBtn);

  const bodyEl = document.createElement("div");
  bodyEl.className = "modal-body";
  if (typeof body === "string") {
    bodyEl.innerHTML = body;
  } else if (body instanceof Node) {
    bodyEl.appendChild(body);
  }

  const foot = document.createElement("div");
  foot.className = "modal-foot";
  if (!hideSecondary) {
    const secondaryBtn = document.createElement("button");
    secondaryBtn.type = "button";
    secondaryBtn.className = "btn btn--ghost";
    secondaryBtn.textContent = secondaryLabel;
    foot.appendChild(secondaryBtn);
    secondaryBtn.addEventListener("click", () => {
      onSecondary?.();
      close();
    });
  }
  const primaryBtn = document.createElement("button");
  primaryBtn.type = "button";
  primaryBtn.className = "btn btn--primary";
  primaryBtn.textContent = primaryLabel;
  foot.appendChild(primaryBtn);

  modal.appendChild(head);
  modal.appendChild(bodyEl);
  modal.appendChild(foot);
  backdrop.appendChild(modal);

  function close() {
    backdrop.remove();
    activeBackdrop = null;
    document.body.style.overflow = "";
    document.removeEventListener("keydown", escapeHandler);
  }

  const escapeHandler = (e) => {
    if (e.key === "Escape" && activeBackdrop === backdrop) {
      onSecondary?.();
      close();
    }
  };

  primaryBtn.addEventListener("click", () => {
    const result = onPrimary?.();
    if (result !== false) close();
  });

  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) {
      onSecondary?.();
      close();
    }
  });

  document.addEventListener("keydown", escapeHandler);

  return { backdrop, close };
}

export function show(config) {
  if (activeBackdrop) activeBackdrop.remove();
  const { backdrop } = createModal(config);
  activeBackdrop = backdrop;
  document.body.style.overflow = "hidden";
  document.body.appendChild(backdrop);
}

export function close() {
  if (activeBackdrop) {
    activeBackdrop.remove();
    activeBackdrop = null;
    document.body.style.overflow = "";
  }
}
