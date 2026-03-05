export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);

  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === "class" || k === "className") node.className = v;
    else if (k === "style" && v && typeof v === "object") Object.assign(node.style, v);
    else if (k === "dataset" && v && typeof v === "object") Object.assign(node.dataset, v);
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v === true) node.setAttribute(k, "");
    else if (v === false || v == null) continue;
    else node.setAttribute(k, String(v));
  }

  for (const child of children.flat()) {
    if (child == null) continue;
    if (child instanceof Node) node.appendChild(child);
    else node.appendChild(document.createTextNode(String(child)));
  }

  return node;
}

export function fragment(...children) {
  const f = document.createDocumentFragment();
  for (const child of children.flat()) {
    if (child == null) continue;
    if (child instanceof Node) f.appendChild(child);
    else f.appendChild(document.createTextNode(String(child)));
  }
  return f;
}

export function clearFocus() {
  const active = document.activeElement;
  if (active && typeof active.blur === "function") active.blur();
}

