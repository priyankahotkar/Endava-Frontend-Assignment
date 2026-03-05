import { HomeView } from "../views/HomeView.js";
import { LotsView } from "../views/LotsView.js";
import { LotDetailsView } from "../views/LotDetailsView.js";
import { BookingsView } from "../views/BookingsView.js";
import { VehiclesView } from "../views/VehiclesView.js";
import { BillingView } from "../views/BillingView.js";

export function routes({ api, store, toastHost }) {
  const ctx = { api, store, toastHost };
  return [
    { path: "/", title: "Home", view: () => HomeView(ctx) },
    { path: "/lots", title: "Parking lots", view: () => LotsView(ctx) },
    { path: "/lots/:lotId", title: "Lot details", view: (p) => LotDetailsView(ctx, p) },
    { path: "/bookings", title: "My bookings", view: () => BookingsView(ctx) },
    { path: "/vehicles", title: "Vehicles", view: () => VehiclesView(ctx) },
    { path: "/billing", title: "Payments & invoices", view: () => BillingView(ctx) },
  ];
}

