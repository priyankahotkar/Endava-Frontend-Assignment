import { init as initNavigation } from "./features/navigation.js";
import { init as initToast } from "./features/toast.js";
import { init as initVehicles } from "./features/vehicles.js";
import { init as initLotBooking } from "./features/lot-booking.js";
import { init as initBookingsActions } from "./features/bookings-actions.js";
import { init as initBilling } from "./features/billing.js";
import { init as initLotsFlow } from "./features/lots-flow.js";
import { init as initBookingsList } from "./features/bookings-list.js";

function runWhenReady(fn) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fn);
  } else {
    fn();
  }
}

runWhenReady(() => {
  const root = document.body;
  initNavigation(root);
  initToast();
  initVehicles(root);
  initLotBooking(root);
  initBookingsActions(root);
  initBilling(root);
  initLotsFlow(root);
  initBookingsList(root);
});
