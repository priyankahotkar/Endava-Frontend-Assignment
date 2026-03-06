## Parking Booking Frontend (Parkwise)

This project is a **pure HTML / CSS / JavaScript frontend** for a parking booking system.

A **mock API layer** simulates the database and network latency using `localStorage`. You can later replace this mock API with real HTTP calls without changing the UI architecture.

---

### 1. Tech stack and constraints

- **Runtime**: Any modern browser
- **Languages**:
  - HTML (`index.html`)
  - CSS (`styles.css`)
  - Vanilla ES modules (all files under `src/`)
- **State & routing**:
  - Small custom **hash router** (`src/router/`)
  - Simple global **store** (`src/state/store.js`)
  - Everything is rendered via **imperative DOM helpers** (no virtual DOM)

You can open the app via the VS Code **Live Server** extension or any static file server.

---

### 2. How to run the project

#### Option A: VS Code Live Server (recommended)

1. Open this folder (`Endava Frontend Assignment`) in VS Code.
2. Install the extension **"Live Server"** (by Ritwick Dey) if you do not have it.
3. Right‑click `index.html` in the Explorer and choose **"Open with Live Server"**.
4. Your browser should open something like `http://127.0.0.1:5500/`.

#### Option B: Any static HTTP server

If you prefer another tool (Python, `http-server`, etc.), just serve this folder as static files:

- Entry file: `index.html`
- All assets are referenced directly (no build step is required).

---

### 3. Project structure

High‑level layout:

- `index.html` – Root HTML, loads styles and `index.js`.
- `styles.css` – Global styles, design system, layout, and components.
- `index.js` – Bootstraps the app (mounts into `#app` and calls `bootstrapApp`).
- `src/`
  - `app/`
    - `bootstrap.js` – Creates store, mock API, router; mounts the `AppShell`.
    - `routes.js` – Defines all routes and maps them to view components.
  - `router/`
    - `router.js` – Simple hash‑based router with `navigate`, `subscribe`, `getCurrent`.
    - `routeMatch.js` – Tiny URL pattern matcher with `:param` support.
  - `state/`
    - `store.js` – Global store for session, UI filters, and client logs.
  - `data/`
    - `mockApi.js` – In‑browser mock API simulating the ER diagram tables.
  - `components/`
    - `AppShell.js` – Global layout: header/nav, main content, footer.
    - `Toast.js` – Toast notification host used across the app.
    - `ui/`
      - `Link.js` – Router‑aware anchor helper.
      - `Modal.js` – Reusable dialog component.
      - `Empty.js` – Shared empty state block.
  - `views/`
    - `HomeView.js` – Landing page, stats, quick actions, reset mock data.
    - `LotsView.js` – List of parking lots with filters.
    - `LotDetailsView.js` – Lot detail page, slots, and booking form.
    - `BookingsView.js` – List, pay, and cancel bookings.
    - `VehiclesView.js` – Manage vehicles for the current user.
    - `BillingView.js` – Payments and invoices view.
    - `_shared.js` – Shared view helpers (loading, error blocks, section headers).
  - `utils/`
    - `dom.js` – DOM helper (`el`, `fragment`, `clearFocus`).
    - `format.js` – Money/date/time formatting and numeric utilities.
    - `uid.js` – Generates reasonably unique IDs with a prefix.

---

### 4. UI overview

The UI aims to feel closer to **Adobe Careers** style: clean typography, pill‑like navigation, and modern card layouts. Key pieces:

- **Top bar** (`AppShell`):
  - Brand ("Parkwise") with gradient square logo.
  - Navigation: Home / Lots / Bookings / Vehicles / Billing.
  - Active route highlighted using `aria-current="page"`.

- **Home page (`HomeView`)**:
  - Hero card: headline, description, CTA to "Find parking".
  - Right side "Today at a glance" stats card:
    - Total lots
    - Open now
    - Your active bookings
  - Below: "Start here" actions to jump into Lots, Vehicles, Bookings, Billing.
  - A button to **reset mock data**, which clears and reseeds the in‑browser database.

- **Lots page (`LotsView`)**:
  - Toolbar with:
    - Search input (by lot name or address).
    - "Open now" checkbox.
    - "Max price" filter.
    - Shortcut to "My bookings".
  - Lots are rendered as cards showing:
    - Name, address.
    - Status chips (open/closed, availability, maintenance).
    - Hourly rate and a "View details" button.

- **Lot details (`LotDetailsView`)**:
  - Left: high‑level lot info (open/closed, slots stats, operating hours).
  - Right: nearby lot suggestions with distances.
  - Booking form:
    - Vehicle selector (must have at least one vehicle).
    - Slot selector (available slots only).
    - Start and end datetime pickers.
    - Live **quote** that calculates estimated cost based on duration.
    - A button to **create booking** (creates a `pending_payment` booking).
  - Slots table showing first N slots with type and status.

- **Bookings (`BookingsView`)**:
  - Tabular list of bookings, including:
    - Lot + slot
    - Start/end time
    - Vehicle number
    - Status (pending, confirmed, cancelled)
    - Cost and booking ID
  - Actions:
    - **Pay** (opens a modal to simulate payment, creates payment + invoice).
    - **Cancel** (cancels booking and frees slot).

- **Vehicles (`VehiclesView`)**:
  - Form to add a vehicle type + vehicle number.
  - Table listing vehicles with remove buttons.
  - Vehicles are used when creating bookings.

- **Billing (`BillingView`)**:
  - Left card: **Payments** table (time, method, status, amount, booking ID).
  - Right card: **Invoices** table (date, status, total, booking ID, invoice ID).

- **Feedback and dialogs**:
  - Toast notifications: success/errors on API actions.
  - Modal dialog for mock checkout.

---

### 5. Mock API and ER‑diagram mapping

The mock API (`src/data/mockApi.js`) mimics the ER diagram. It keeps everything in a JS object and persists it via `localStorage` so state survives page reloads.

#### 5.1. Seed data

On first load (or when "Reset mock data" is pressed), the app seeds:

- **users**
  - A single demo user (`usr_demo_001`).
- **vehicles**
  - A couple of vehicles attached to the demo user.
- **parking_lots**
  - Several sample lots with:
    - `lot_id`, `lot_name`, `address`
    - `latitude`, `longitude`
    - `hourly_rate`
    - `total_slots`, `open_hour`, `close_hour`
- **parking_slots**
  - For each lot, expands `total_slots` into multiple `slots`:
    - `slot_id`, `lot_id`, `slot_number`
    - `slot_type` (`standard`, `compact`, `ev`)
    - `status` (`available`, `occupied`, `maintenance`)
- **nearby_parkings**
  - Cross‑references between lots with `distance_in_meters`.
- **bookings, payments, invoices, logs**
  - Start empty and get filled by user actions.

#### 5.2. Example endpoints

These are **not network requests**, just functions that simulate them with `setTimeout`:

- **Lots & lots details**
  - `listLots({ query, openNow, maxPrice })`
  - `getLot(lot_id)`
- **Vehicles**
  - `listVehicles(user_id)`
  - `addVehicle(user_id, payload)`
  - `removeVehicle(user_id, vehicle_id)`
- **Bookings**
  - `quoteBooking(user_id, payload)` – calculates cost only.
  - `createBooking(user_id, payload)` – writes a `pending_payment` booking.
  - `listBookings(user_id)`
  - `cancelBooking(user_id, booking_id)`
  - `payForBooking(user_id, booking_id, payload)` – creates payment + invoice and marks booking confirmed.
- **Billing**
  - `listBilling(user_id)` – returns `payments` and `invoices` joined by booking ID.
- **Misc**
  - `stats(user_id)` – summary for the home hero.
  - `reset()` – re‑seeds all data.

Each write operation also records an entry in **`logs`** within the mock DB and a **client log** via `store.log`, giving you two layers of audit data you can wire to a future admin view.

---

### 6. State management

The store (`src/state/store.js`) is deliberately tiny and framework‑agnostic:

- Holds:
  - `session.userId` – current user (hard‑coded to the demo user).
  - `ui.lotFilters` – search / open‑now / max‑price filters.
  - `clientLogs` – a capped, in‑memory action log for debugging.
- Provides:
  - `getState()` – deep‑cloned snapshot.
  - `set(partial)` – shallow merge at root level.
  - `patch(path, value)` – minimal path‑based setter (e.g. `"ui.lotFilters"`).
  - `log(action, details)` – append‑only client log.
  - `subscribe(fn)` – change subscriptions.

Later, when you plug in a real backend, you can keep this store as is and just swap the `mockApi` implementation.

---

### 7. Routing

Routing is implemented in `src/router/` and is based on URL **hash fragments**:

- All routes are defined in `src/app/routes.js`.
- URLs look like:
  - `#/` – Home
  - `#/lots` – List of parking lots
  - `#/lots/lot_001` – Specific lot details
  - `#/bookings`, `#/vehicles`, `#/billing`
- `router.js`:
  - `start()` attaches `hashchange` listener and resolves the initial route.
  - `navigate(path)` updates `window.location.hash`.
  - `subscribe(listener)` notifies the `AppShell` when the route changes.
- `routeMatch.js`:
  - Matches patterns like `/lots/:lotId` and returns `{ route, params }`.

There is **no history API** usage, only hash changes, so it works fine from static hosting without server‑side routing configuration.

---

### 8. CSS & naming conventions

- **Classes**: kebab‑case (e.g. `.topbar-inner`, `.hero-card`, `.card-body`, `.toast-host`).
- **IDs**:
  - single‑word ids like `main`, `app`.
  - multi‑word ids are also kebab‑case (e.g. `open-now`).
- **Data attributes**: follow the same style (e.g. `data-stat="stat-open"`).
- **JS**:
  - camelCase for variables and functions.
  - PascalCase for component/view files (`AppShell.js`, `BookingsView.js`).

This keeps the project consistent and easy to scan.

---

### 9. How to plug in a real backend later

To hook this UI to your actual APIs:

1. **Replace `mockApi` only**:
   - Keep the **function signatures** the same as in `src/data/mockApi.js`.
   - Inside each function, instead of reading/writing local JS objects, perform `fetch` / Axios calls to your backend.
   - For example, `listLots` would `GET /api/lots` with query params, and `createBooking` would `POST /api/bookings`.

2. **Keep the rest of the code unchanged**:
   - Views (`LotsView`, `LotDetailsView`, etc.) only know they are calling `api.someMethod()`.
   - As long as you return similar shapes (or adapt them slightly), no UI changes are needed.

3. **Gradually align with your real ER schema**:
   - If your backend uses different field names, map them in the API layer.
   - If you add new tables (e.g. promotions, coupons), introduce new API methods and extend views as needed.

---

### 10. Ideas for next steps

- Add **authentication UI** (sign in / sign up) once backend is ready.
- Add a **map preview** on lot details using the coordinates.
- Implement a **logs view** for admins (reading from `db.logs`).
- Improve responsiveness for very small screens with more layout tweaks.
- Extract a tiny **design‑tokens** file if you want to share colors/spacing with a future design system.
