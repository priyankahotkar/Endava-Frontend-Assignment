export function query(selector, root = document) {
  return root.querySelector(selector);
}

export function queryAll(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

export function on(element, eventName, handler, options) {
  if (!element) return;
  element.addEventListener(eventName, handler, options);
  return () => element.removeEventListener(eventName, handler, options);
}
