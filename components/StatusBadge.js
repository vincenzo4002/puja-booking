const CLASS = {
  Pending: "pending",
  Confirmed: "confirmed",
  "In Progress": "progress",
  Completed: "completed",
};

export default function StatusBadge({ status }) {
  return (
    <span className={`badge badge-${CLASS[status] || "pending"}`}>
      <span className="badge-dot" aria-hidden="true" />
      {status}
    </span>
  );
}
