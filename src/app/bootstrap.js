import { createRouter } from "../router/router.js";
import { createStore } from "../state/store.js";
import { mockApi } from "../data/mockApi.js";
import { AppShell } from "../components/AppShell.js";
import { ToastHost } from "../components/Toast.js";
import { routes } from "./routes.js";

export function bootstrapApp(mountEl) {
  if (!mountEl) throw new Error("Missing mount element");

  const store = createStore();
  const api = mockApi({ storageKey: "parkwise_db_v1" });

  const toastHost = ToastHost();
  document.body.appendChild(toastHost.el);

  const router = createRouter({
    routes: routes({ api, store, toastHost }),
    onNavigate: () => window.scrollTo({ top: 0, behavior: "auto" }),
  });

  const shell = AppShell({ router, store });
  mountEl.replaceChildren(shell.el);

  router.start();
}

