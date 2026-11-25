import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/db.js";
import Booking from "../../../../models/Booking.js";
import { STATUSES } from "../../../../lib/constants.js";

export const dynamic = "force-dynamic";

// `id` in the URL is the human-readable bookingId (e.g. PB-1001).
const serialize = ({ _id, __v, ...rest }) => ({ id: String(_id), ...rest });

export async function GET(_req, { params }) {
  try {
    const { id } = await params;
    await connectDB();
    const doc = await Booking.findOne({ bookingId: id }).lean();
    if (!doc) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    return NextResponse.json({ booking: serialize(doc) });
  } catch (err) {
    console.error("GET /api/bookings/[id] failed:", err);
    return NextResponse.json({ error: "Could not load booking." }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { status, note } = body || {};
    if (!STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    await connectDB();
    const current = await Booking.findOne({ bookingId: id }).lean();
    if (!current) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    if (current.status === status) {
      return NextResponse.json({ booking: serialize(current) });
    }

    const entry = { status, at: new Date() };
    if (typeof note === "string" && note.trim()) entry.note = note.trim().slice(0, 300);

    const updated = await Booking.findOneAndUpdate(
      { bookingId: id },
      { $set: { status }, $push: { statusHistory: entry } },
      { new: true }
    ).lean();

    return NextResponse.json({ booking: serialize(updated) });
  } catch (err) {
    console.error("PATCH /api/bookings/[id] failed:", err);
    return NextResponse.json({ error: "Could not update status." }, { status: 500 });
  }
}
