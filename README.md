# Puja Booking Dashboard

An admin dashboard for managing puja bookings. Built with **Next.js (App Router) + React**, **Next.js API routes (Node.js)** and **MongoDB via Mongoose**.

## Features

- Searchable bookings table: Booking ID, devotee, puja, date, amount, status
- Search by booking ID, devotee name, phone or puja (debounced, server-side)
- Filters: status chips (with live counts), puja type, date range
- Sorting on every column (click a header to toggle asc/desc), server-side pagination
- Booking details drawer: full devotee and booking info plus status history
- Status changes (Pending → Confirmed → In Progress → Completed) from the table or the drawer, persisted to MongoDB with a history entry
- Responsive: the table turns into stacked cards on phones; light and dark themes

## Setup

Requires Node 20+ and a MongoDB instance (local or Atlas).

```bash
npm install
cp .env.example .env.local     # set MONGODB_URI
npm run seed                   # inserts 42 sample bookings (replaces existing ones)
npm run dev                    # http://localhost:3000
```

If `MONGODB_URI` is not set, it defaults to `mongodb://127.0.0.1:27017/puja_dashboard`.

## API

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/bookings` | List bookings. Query: `q`, `status`, `puja`, `from`, `to` (YYYY-MM-DD), `sort` (`bookingId`, `devotee`, `puja`, `pujaDate`, `amount`, `status`), `order` (`asc`/`desc`), `page`, `limit` (max 50). Returns `bookings`, `total`, `pages`, per-status `counts` and the list of `pujas`. |
| GET | `/api/bookings/:bookingId` | Single booking, e.g. `/api/bookings/PB-1001` |
| PATCH | `/api/bookings/:bookingId` | Body `{ "status": "Confirmed", "note": "optional" }`. Validates the status, saves it and appends to `statusHistory`. |

## Structure

```
app/
  page.js                   dashboard (table, filters, sorting, pagination)
  api/bookings/route.js     list/search/filter/sort endpoint
  api/bookings/[id]/route.js  detail + status update
components/                 BookingDrawer, StatusBadge
lib/                        db connection, constants, formatters
models/Booking.js           Mongoose schema
scripts/seed.js             sample data
```

## Notes and possible next steps

- Admin auth is not included. Add it (e.g. NextAuth or middleware) before exposing this anywhere real.
- Any status can be set from any other status. If you want a strict flow, enforce allowed transitions in the PATCH handler.
- Date filters are interpreted in UTC.
# puja-booking
# puja-booking
