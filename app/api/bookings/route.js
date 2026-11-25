import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/db.js";
import Booking from "../../../models/Booking.js";
import { STATUSES } from "../../../lib/constants.js";

export const dynamic = "force-dynamic";

// Whitelist of sortable fields -> Mongo paths.
const SORTS = {
  bookingId: "bookingId",
  devotee: "devotee.name",
  puja: "puja",
  pujaDate: "pujaDate",
  amount: "amount",
  status: "status",
};

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function parseDate(value, endOfDay = false) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  if (endOfDay) d.setUTCHours(23, 59, 59, 999);
  return d;
}

export async function GET(req) {
  try {
    await connectDB();
    const sp = req.nextUrl.searchParams;

    const q = (sp.get("q") || "").trim().slice(0, 100);
    const status = sp.get("status") || "";
    const puja = sp.get("puja") || "";
    const from = parseDate(sp.get("from"));
    const to = parseDate(sp.get("to"), true);

    const sortKey = SORTS[sp.get("sort")] ? sp.get("sort") : "pujaDate";
    const order = sp.get("order") === "asc" ? 1 : -1;
    const page = Math.max(1, parseInt(sp.get("page"), 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(sp.get("limit"), 10) || 10));

    // `base` = everything except the status filter, so status counts stay useful.
    const base = {};
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      base.$or = [
        { bookingId: rx },
        { "devotee.name": rx },
        { "devotee.phone": rx },
        { puja: rx },
      ];
    }
    if (puja) base.puja = puja;
    if (from || to) {
      base.pujaDate = {};
      if (from) base.pujaDate.$gte = from;
      if (to) base.pujaDate.$lte = to;
    }

    const filter = { ...base };
    if (STATUSES.includes(status)) filter.status = status;

    const [docs, total, countsAgg, pujas] = await Promise.all([
      Booking.find(filter)
        .sort({ [SORTS[sortKey]]: order, _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Booking.countDocuments(filter),
      Booking.aggregate([
        { $match: base },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Booking.distinct("puja"),
    ]);

    const counts = Object.fromEntries(STATUSES.map((s) => [s, 0]));
    for (const row of countsAgg) counts[row._id] = row.count;

    return NextResponse.json({
      bookings: docs.map(({ _id, __v, ...rest }) => ({ id: String(_id), ...rest })),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
      limit,
      counts,
      pujas: pujas.sort(),
    });
  } catch (err) {
    console.error("GET /api/bookings failed:", err);
    return NextResponse.json(
      { error: "Could not load bookings. Is MongoDB running and MONGODB_URI set?" },
      { status: 500 }
    );
  }
}
