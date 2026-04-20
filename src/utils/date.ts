const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function formatMonth(iso: string): string {
  const [year, month] = iso.split("-");
  const idx = Number(month) - 1;
  return `${MONTHS[idx] ?? ""} ${year}`.trim();
}

export function formatRange(start: string, end: string | null): string {
  const endLabel = end ? formatMonth(end) : "Present";
  return `${formatMonth(start)} – ${endLabel}`;
}
