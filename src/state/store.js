import { uid } from "../utils/uid.js";

export function createStore() {
  const listeners = new Set();
  const state = {
    session: {
      userId: "usr_demo_001",
    },
    ui: {
      lotFilters: { query: "", openNow: false, maxPrice: "" },
    },
    clientLogs: [],
  };

  function getState() {
    return structuredClone(state);
  }

  function set(partial) {
    Object.assign(state, partial);
    listeners.forEach((fn) => fn(getState()));
  }

  function patch(path, value) {
    const segs = path.split(".");
    let cur = state;
    for (let i = 0; i < segs.length - 1; i++) cur = cur[segs[i]];
    cur[segs[segs.length - 1]] = value;
    listeners.forEach((fn) => fn(getState()));
  }

  function log(action, details) {
    state.clientLogs.unshift({
      log_id: uid("log"),
      user_id: state.session.userId,
      action,
      timestamp: new Date().toISOString(),
      details: typeof details === "string" ? details : JSON.stringify(details),
    });
    state.clientLogs = state.clientLogs.slice(0, 50);
    listeners.forEach((fn) => fn(getState()));
  }

  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  return { getState, set, patch, log, subscribe };
}

