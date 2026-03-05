import { el } from "../utils/dom.js";

export function LoadingBlock({ title = "Loading", message = "Please wait…" } = {}) {
  return {
    el: el(
      "div",
      { class: "section" },
      el(
        "div",
        { class: "empty" },
        el("div", { style: { fontWeight: 850, marginBottom: "6px" } }, title),
        el("div", {}, message),
      ),
    ),
  };
}

export function ErrorBlock({ title = "Something went wrong", message = "Try again in a moment." } = {}) {
  return {
    el: el(
      "div",
      { class: "section" },
      el(
        "div",
        { class: "empty" },
        el("div", { style: { fontWeight: 850, marginBottom: "6px" } }, title),
        el("div", {}, message),
      ),
    ),
  };
}

export function sectionHead({ title, subtitle, right }) {
  return el(
    "div",
    { class: "section-head" },
    el("div", {}, el("h2", { class: "section-title" }, title), subtitle ? el("p", { class: "section-sub" }, subtitle) : null),
    right ? el("div", {}, right) : null,
  );
}

