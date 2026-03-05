import { el } from "../../utils/dom.js";

export function EmptyState({ title = "Nothing here yet", message = "Try adjusting your filters or creating a new item.", action } = {}) {
  const body = el("div", { class: "empty" }, el("div", { style: { fontWeight: 800, marginBottom: "6px" } }, title), el("div", {}, message));
  if (action?.el) body.appendChild(el("div", { style: { marginTop: "12px" } }, action.el));
  return { el: body };
}

