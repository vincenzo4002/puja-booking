"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { STATUSES } from "@/lib/constants";
import { formatDate, formatINR } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";
import BookingDrawer from "@/components/BookingDrawer";

const COLUMNS = [
  { key: "bookingId", label: "Booking ID" },
  { key: "devotee", label: "Devotee" },
  { key: "puja", label: "Puja" },
  { key: "pujaDate", label: "Date" },
  { key: "amount", label: "Amount", align: "right" },
  { key: "status", label: "Status" },
];

const PAGE_SIZE = 10;

async function patchStatus(bookingId, status) {
  const res = await fetch(`/api/bookings/${encodeURIComponent(bookingId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Update failed");
  return json.booking;
}

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [q, setQ] = useState(""); // debounced search
  const [status, setStatus] = useState("");
  const [puja, setPuja] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState("pujaDate");
  const [order, setOrder] = useState("desc");
  const [page, setPage] = useState(1);

  const [data, setData] = useState({ bookings: [], total: 0, pages: 1, counts: {}, pujas: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState(null);

  // Debounce the search box.
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const abortRef = useRef(null);
  const load = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const params = new URLSearchParams({ sort, order, page, limit: PAGE_SIZE });
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (puja) params.set("puja", puja);
    if (from) params.set("from", from);
    if (to) params.set("to", to);

    setLoading(true);
    try {
      const res = await fetch(`/api/bookings?${params}`, { signal: controller.signal });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Request failed");
      setData(json);
      setError("");
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.message);
    } finally {
      if (abortRef.current === controller) setLoading(false);
    }
  }, [q, status, puja, from, to, sort, order, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  function toggleSort(key) {
    if (sort === key) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setSort(key);
      setOrder("asc");
    }
    setPage(1);
  }

  async function handleStatusChange(bookingId, newStatus) {
    try {
      const updated = await patchStatus(bookingId, newStatus);
      setToast({ type: "ok", msg: `${bookingId} marked ${newStatus}` });
      load();
      return updated;
    } catch (err) {
      setToast({ type: "err", msg: err.message });
      return null;
    }
  }

  const filtersActive = search || status || puja || from || to;
  function resetFilters() {
    setSearch("");
    setQ("");
    setStatus("");
    setPuja("");
    setFrom("");
    setTo("");
    setPage(1);
  }

  const totalAll = STATUSES.reduce((n, s) => n + (data.counts?.[s] || 0), 0);
  const startIdx = data.total === 0 ? 0 : (data.page - 1) * PAGE_SIZE + 1;
  const endIdx = Math.min(data.total, data.page * PAGE_SIZE);

  return (
    <main className="shell">
      <header className="page-head">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Puja Bookings</h1>
        </div>
      </header>

      <section className="chips" aria-label="Filter by status">
        <button
          className={`chip ${status === "" ? "active" : ""}`}
          onClick={() => {
            setStatus("");
            setPage(1);
          }}
        >
          All <b>{totalAll}</b>
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            className={`chip ${status === s ? "active" : ""}`}
            onClick={() => {
              setStatus(status === s ? "" : s);
              setPage(1);
            }}
          >
            {s} <b>{data.counts?.[s] ?? 0}</b>
          </button>
        ))}
      </section>

      <section className="toolbar" aria-label="Search and filters">
        <label className="control grow">
          <span>Search</span>
          <input
            type="search"
            placeholder="Booking ID, devotee, phone or puja"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label className="control">
          <span>Puja</span>
          <select
            value={puja}
            onChange={(e) => {
              setPuja(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All pujas</option>
            {data.pujas.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label className="control">
          <span>From</span>
          <input
            type="date"
            value={from}
            max={to || undefined}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <label className="control">
          <span>To</span>
          <input
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <button className="btn ghost" onClick={resetFilters} disabled={!filtersActive}>
          Reset
        </button>
      </section>

      {error ? (
        <div className="alert" role="alert">
          {error}
          <button className="btn" onClick={load}>
            Retry
          </button>
        </div>
      ) : null}

      <section className={`card ${loading ? "is-loading" : ""}`} aria-busy={loading}>
        <table className="table">
          <thead>
            <tr>
              {COLUMNS.map((c) => (
                <th
                  key={c.key}
                  className={c.align === "right" ? "right" : ""}
                  aria-sort={
                    sort === c.key ? (order === "asc" ? "ascending" : "descending") : "none"
                  }
                >
                  <button className="sort" onClick={() => toggleSort(c.key)}>
                    {c.label}
                    <span aria-hidden="true" className="arrow">
                      {sort === c.key ? (order === "asc" ? "▲" : "▼") : "↕"}
                    </span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.bookings.map((b) => (
              <tr key={b.id} onClick={() => setSelected(b)}>
                <td data-label="Booking ID">
                  <button
                    className="link"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelected(b);
                    }}
                  >
                    {b.bookingId}
                  </button>
                </td>
                <td data-label="Devotee">
                  <div className="primary">{b.devotee?.name}</div>
                  <div className="secondary">{b.devotee?.phone}</div>
                </td>
                <td data-label="Puja">{b.puja}</td>
                <td data-label="Date">{formatDate(b.pujaDate)}</td>
                <td data-label="Amount" className="right num">
                  {formatINR(b.amount)}
                </td>
                <td data-label="Status" onClick={(e) => e.stopPropagation()}>
                  <div className="status-cell">
                    <StatusBadge status={b.status} />
                    <select
                      className="mini-select"
                      aria-label={`Change status of ${b.bookingId}`}
                      value={b.status}
                      onChange={(e) => handleStatusChange(b.bookingId, e.target.value)}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && !error && data.bookings.length === 0 ? (
          <div className="empty">
            <p>No bookings match your filters.</p>
            {filtersActive ? (
              <button className="btn" onClick={resetFilters}>
                Clear filters
              </button>
            ) : (
              <p className="muted">Run <code>npm run seed</code> to add sample data.</p>
            )}
          </div>
        ) : null}

        <footer className="pager">
          <span className="muted">
            {data.total === 0 ? "0 results" : `Showing ${startIdx}–${endIdx} of ${data.total}`}
          </span>
          <div className="pager-btns">
            <button className="btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Previous
            </button>
            <span className="muted">
              Page {data.page} of {data.pages}
            </span>
            <button className="btn" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>
              Next
            </button>
          </div>
        </footer>
      </section>

      {selected ? (
        <BookingDrawer
          key={selected.bookingId}
          bookingId={selected.bookingId}
          initial={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
        />
      ) : null}

      {toast ? (
        <div className={`toast ${toast.type}`} role="status">
          {toast.msg}
        </div>
      ) : null}
    </main>
  );
}
