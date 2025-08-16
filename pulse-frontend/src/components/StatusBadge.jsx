export default function StatusBadge({ status, conclusion }) {
  // choose label + color from either status or conclusion
  const label = (conclusion || status || "unknown")?.toLowerCase();
  const color =
    label === "success"
      ? "bg-green-100 text-green-700 border-green-200"
      : label === "failure" || label === "cancelled" || label === "timed_out"
      ? "bg-red-100 text-red-700 border-red-200"
      : label === "in_progress" || label === "queued"
      ? "bg-amber-100 text-amber-700 border-amber-200"
      : "bg-gray-100 text-gray-700 border-gray-200";

  return (
    <span
      className={`text-xs px-2 py-1 rounded-full border ${color} capitalize`}
    >
      {label.replaceAll("_", " ")}
    </span>
  );
}