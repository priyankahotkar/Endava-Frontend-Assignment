import { matchRoute } from "./routeMatch.js";

export function createRouter({ routes, onNavigate }) {
  const listeners = new Set();
  let current = { path: "/", params: {}, route: null };

  function getPath() {
    const hash = window.location.hash || "#/";
    const raw = hash.startsWith("#") ? hash.slice(1) : hash;
    const path = raw.startsWith("/") ? raw : `/${raw}`;
    return path.split("?")[0];
  }

  function navigate(path) {
    const normalized = path.startsWith("/") ? path : `/${path}`;
    if (window.location.hash === `#${normalized}`) return;
    window.location.hash = normalized;
  }

  function resolve() {
    const path = getPath();
    const match = matchRoute(routes, path);
    current = {
      path,
      params: match?.params ?? {},
      route: match?.route ?? null,
    };
    if (typeof onNavigate === "function") onNavigate(current);
    listeners.forEach((fn) => fn(current));
  }

  function start() {
    window.addEventListener("hashchange", resolve);
    if (!window.location.hash) window.location.hash = "#/";
    resolve();
  }

  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  function getCurrent() {
    return current;
  }

  return { start, navigate, subscribe, getCurrent, getPath };
}

