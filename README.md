## Parking Booking Frontend (Parkwise)

This project is a **pure HTML + CSS static multi-page frontend** for a parking booking system.

---

### 1. Tech stack and constraints

- **Runtime**: Any modern browser
- **Languages**:
  - HTML (`*.html`)
  - CSS (`styles.css`)

You can open the site via the VS Code **Live Server** extension or any static file server.

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

- `index.html` – Home page.
- `lots.html` – Parking lots list.
- `lot-details.html` – Sample lot details page.
- `bookings.html` – Bookings overview.
- `vehicles.html` – Vehicles overview.
- `billing.html` – Payments & invoices overview.
- `styles.css` – Global styles (design tokens + components).

---

### 4. Pages

- `index.html` (Home): hero, quick stats, and entry links.
- `lots.html`: sample lots list.
- `lot-details.html`: sample lot details + rates table.
- `bookings.html`: sample bookings table.
- `vehicles.html`: sample vehicles table + disabled form.
- `billing.html`: sample invoices table.

---

### 5. CSS & naming conventions

- **Classes**: kebab‑case (e.g. `.topbar-inner`, `.hero-card`, `.card-body`).
- **Modifiers**: kebab‑case (e.g. `.btn--primary`, `.badge--success`, `.dot--warning`).
- **IDs**:
  - single‑word ids like `main`
  - multi‑word ids are kebab‑case (e.g. `open-now`)

---

### 6. Ideas for next steps

- Add real data (API) and forms (currently static).
- Add a map preview on lot details.
- Improve responsiveness for very small screens with more layout tweaks.
