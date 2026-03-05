export function uid(prefix = "id") {
  const rand = Math.random().toString(16).slice(2, 10);
  const t = Date.now().toString(16);
  return `${prefix}_${t}_${rand}`;
}

