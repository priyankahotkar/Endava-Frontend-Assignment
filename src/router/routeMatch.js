function splitPath(path) {
  const clean = path.split("?")[0].replace(/\/+$/, "") || "/";
  return clean === "/" ? [""] : clean.split("/").filter(Boolean);
}

export function matchRoute(routes, path) {
  const segs = splitPath(path);
  for (const route of routes) {
    const routeSegs = splitPath(route.path);
    if (routeSegs.length !== segs.length) continue;
    const params = {};
    let ok = true;
    for (let i = 0; i < routeSegs.length; i++) {
      const rs = routeSegs[i];
      const ps = segs[i];
      if (rs.startsWith(":")) {
        params[rs.slice(1)] = decodeURIComponent(ps);
      } else if (rs !== ps) {
        ok = false;
        break;
      }
    }
    if (ok) return { route, params };
  }
  return null;
}

