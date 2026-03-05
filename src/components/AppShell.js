import { el } from "../utils/dom.js";
import { Link } from "./ui/Link.js";

export function AppShell({ router, store }) {
  const main = el("main", { id: "main" });
  const viewHost = el("div", { class: "container" });
  main.appendChild(viewHost);

  const brandLink = Link(router, "/");
  const brand = el(
    "a",
    { class: "brand", href: brandLink.href, onclick: brandLink.onClick },
    el("span", { class: "brand-mark", "aria-hidden": "true" }),
    el("span", {}, "Parkwise"),
  );

  const nav = el("nav", { class: "nav", "aria-label": "Primary" });
  const navItems = [
    { path: "/", label: "Home" },
    { path: "/lots", label: "Lots" },
    { path: "/bookings", label: "Bookings" },
    { path: "/vehicles", label: "Vehicles" },
    { path: "/billing", label: "Billing" },
  ].map((it) => {
    const l = Link(router, it.path);
    const a = el("a", { href: l.href, onclick: l.onClick }, it.label);
    nav.appendChild(a);
    return { ...it, el: a };
  });

  const topbar = el(
    "header",
    { class: "topbar" },
    el("div", { class: "container" }, el("div", { class: "topbar-inner" }, brand, nav)),
  );

  const footer = el(
    "footer",
    { class: "footer" },
    el(
      "div",
      { class: "container" },
      el(
        "div",
        { class: "footer-inner" },
        el("small", {}, "Parkwise — mock frontend (vanilla JS)."),
        el("small", { class: "mono" }, `User: ${store.getState().session.userId}`),
      ),
    ),
  );

  let currentCleanup = null;
  function renderRoute({ route, params, path }) {
    navItems.forEach((it) => {
      const isCurrent = it.path === path || (it.path !== "/" && path.startsWith(it.path));
      if (isCurrent) it.el.setAttribute("aria-current", "page");
      else it.el.removeAttribute("aria-current");
    });

    if (currentCleanup) {
      try {
        currentCleanup();
      } catch {
        // ignore
      }
      currentCleanup = null;
    }

    if (!route) {
      document.title = "Not found — Parkwise";
      const notFound = el(
        "div",
        { class: "section" },
        el("div", { class: "empty" }, el("div", { style: { fontWeight: 800 } }, "Page not found"), el("div", {}, "Try using the navigation above.")),
      );
      viewHost.replaceChildren(notFound);
      return;
    }

    document.title = `${route.title || "Parkwise"} — Parkwise`;
    const result = route.view(params);
    const node = result?.el instanceof Node ? result.el : result instanceof Node ? result : el("div", {}, "Invalid view");
    viewHost.replaceChildren(node);
    currentCleanup = typeof result?.cleanup === "function" ? result.cleanup : null;
  }

  router.subscribe(renderRoute);
  renderRoute(router.getCurrent());

  const shell = el("div", { class: "app-shell" }, topbar, main, footer);
  return { el: shell };
}

