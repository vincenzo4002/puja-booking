"use client";

import { useEffect, useState } from "react";
import { STATUSES } from "@/lib/constants";
import { formatDate, formatDateTime, formatINR } from "@/lib/format";
import StatusBadge from "./StatusBadge";

function Field({ label, children }) {
  return (
    <div className="field">
      <dt>{label}</dt>
      <dd>{children || "—"}</dd>
    </div>
  );
}

export default function BookingDrawer({ bookingId, initial, onClose, onStatusChange }) {
  const [booking, setBooking] = useState(initial);
  const [saving, setSaving] = useState(false);

  // Show the row data immediately, then refresh with the full record.
  useEffect(() => {
    setBooking(initial);
    let cancelled = false;
    fetch(`/api/bookings/${encodeURIComponent(bookingId)}`)
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled && j.booking) setBooking(j.booking);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function change(status) {
    if (saving || status === booking.status) return;
    setSaving(true);
    const updated = await onStatusChange(booking.bookingId, status);
    if (updated) setBooking(updated);
    setSaving(false);
  }

  const d = booking.devotee || {};
  const history = [...(booking.statusHistory || [])].reverse();

  return (
    <div className="overlay" onClick={onClose}>
      <aside
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-label={`Booking ${booking.bookingId}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="drawer-head">
          <div>
            <p className="eyebrow">{booking.bookingId}</p>
            <h2>{booking.puja}</h2>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close details">
            ✕
          </button>
        </header>

        <div className="drawer-body">
          <section>
            <h3>Status</h3>
            <div className="segmented" role="group" aria-label="Change status">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={saving}
                  aria-pressed={booking.status === s}
                  className={booking.status === s ? "seg active" : "seg"}
                  onClick={() => change(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3>Booking</h3>
            <dl className="fields">
              <Field label="Date">{formatDate(booking.pujaDate)}</Field>
              <Field label="Time">
                {new Date(booking.pujaDate).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Field>
              <Field label="Amount">{formatINR(booking.amount)}</Field>
              <Field label="Mode">{booking.mode}</Field>
              <Field label="Location">{booking.location}</Field>
              <Field label="Pandit">{booking.pandit}</Field>
            </dl>
          </section>

          <section>
            <h3>Devotee</h3>
            <dl className="fields">
              <Field label="Name">{d.name}</Field>
              <Field label="Gotra">{d.gotra}</Field>
              <Field label="Phone">{d.phone}</Field>
              <Field label="Email">{d.email}</Field>
            </dl>
          </section>

          {booking.notes ? (
            <section>
              <h3>Notes</h3>
              <p className="notes">{booking.notes}</p>
            </section>
          ) : null}

          <section>
            <h3>Status history</h3>
            {history.length === 0 ? (
              <p className="muted">No history recorded.</p>
            ) : (
              <ol className="timeline">
                {history.map((h, i) => (
                  <li key={`${h.status}-${h.at}-${i}`}>
                    <StatusBadge status={h.status} />
                    <time>{formatDateTime(h.at)}</time>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </aside>
    </div>
  );
}
