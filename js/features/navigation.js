import { queryAll } from "../lib/dom.js";

const CURRENT_PAGE = "page";

function getCurrentPath() {
  const path = window.location.pathname || "";
  const base = path.split("/").filter(Boolean).pop() || "index.html";
  return base === "" ? "index.html" : base;
}

function setActiveNavLink(nav) {
  const path = getCurrentPath();
  const links = queryAll("a[href]", nav);
  links.forEach((link) => {
    const href = (link.getAttribute("href") || "").replace(/^\.\//, "");
    const linkPath = href.split("/").pop() || "";
    const isCurrent =
      linkPath === path ||
      (path === "index.html" && (linkPath === "" || linkPath === "index.html"));
    link.setAttribute("aria-current", isCurrent ? CURRENT_PAGE : "");
  });
}

export function init(root = document) {
  const nav = root.querySelector(".nav");
  if (!nav) return;
  setActiveNavLink(nav);
}
