# ✂️ Stitch Track

![CI](https://github.com/rchaitra9793-hue/StitchTrack/actions/workflows/ci.yml/badge.svg)

An order manager for boutiques. Customers submit **blouse** or **kurti** measurements through a simple form and track their order with a private code. The boutique owner manages every order from **Pending → Stitching → Ready → Delivered**, records payments, and notifies customers on WhatsApp.

## Features

**For customers**
- Order form whose measurement fields change with the garment type
- **Saved measurements**: returning customers (matched by phone) can reuse their last measurements in one click
- **Order tracking** with a 6-character code, showing a progress timeline and any balance due

**For the boutique owner**
- Password-protected dashboard (JWT)
- Stats: orders in progress, overdue orders, ready for pickup, balance to collect
- **Overdue / due-soon badges**, with the most urgent orders sorted to the top
- Search by name or phone, and filter by status
- Order details: measurements, status updates, price, advance and balance
- One-click **WhatsApp message** when an order is ready

## Tech Stack

| Layer    | Tech                                    |
| -------- | --------------------------------------- |
| Frontend | React, Vite, React Router, Tailwind CSS |
| Backend  | Node.js, Express                        |
| Database | SQLite (better-sqlite3)                 |
| Auth     | JSON Web Tokens                         |
| Testing  | Vitest, Supertest                       |
| CI       | GitHub Actions                          |

## Getting Started

**Requirements:** Node.js 22+

```bash
git clone https://github.com/rchaitra9793-hue/StitchTrack.git
cd StitchTrack
npm install
cp server/.env.example server/.env   # optional – defaults work out of the box
npm run dev
```

- App: http://localhost:5173
- API: http://localhost:5050

Default owner password: `admin123` (change it as `OWNER_PASSWORD` in `server/.env`).

### Run tests

```bash
npm test
```

The tests use an in-memory database, so your real data is never touched.

## API

| Method | Endpoint                    | Auth  | Description                              |
| ------ | --------------------------- | ----- | ---------------------------------------- |
| POST   | `/api/login`                | –     | Get owner token                          |
| POST   | `/api/orders`               | –     | Create order, returns tracking code      |
| GET    | `/api/orders/lookup`        | –     | Saved measurements (`?phone=&garment_type=`) |
| GET    | `/api/orders/track/:code`   | –     | Public order status                      |
| GET    | `/api/orders`               | Owner | List (`?status=&search=`)                |
| GET    | `/api/orders/:id`           | Owner | Order details                            |
| PATCH  | `/api/orders/:id`           | Owner | Update status, price, advance            |
| DELETE | `/api/orders/:id`           | Owner | Delete order                             |

## Project Structure

```
client/               React app
  src/pages/          Home, OrderForm, Track, Login, Dashboard, OrderDetail
  src/components/     Navbar, StatusBadge, DueBadge
  src/garments.js     Measurement fields per garment
server/               Express API
  app.js              Express app (imported by tests)
  index.js            Starts the server
  db.js               SQLite setup + migrations
  auth.js             Login + JWT middleware
  routes/orders.js    Order routes
  test/               API tests
```

## Design Decisions

- **SQLite**: no database server to install; clone and run.
- **Tracking codes** are random and avoid look-alike characters (0/O, 1/I), so customers can't guess other people's orders by number.
- **The public tracking endpoint** returns only the first name, status and balance, never the phone number or measurements.
- **The owner sees urgent work first**: active orders are sorted by due date, and delivered ones go to the bottom.
