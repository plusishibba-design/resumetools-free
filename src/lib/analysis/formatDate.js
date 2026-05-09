// Date formatting helpers.
// Inputs come from <input type="month"> as 'YYYY-MM' strings, or free text.
// We display them as 'MMM YYYY' (e.g. "Jan 2020"). Free-text values pass through.
// Special token "Present" is recognised and rendered as-is.

const MONTH_NAMES_EN = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function formatYearMonth(value) {
  if (!value) return '';
  const v = String(value).trim();
  if (!v) return '';
  // Already display-formatted (free text fallback) — pass through
  if (!/^\d{4}-\d{2}/.test(v)) return v;
  const [y, m] = v.split('-');
  const monthIdx = parseInt(m, 10) - 1;
  if (monthIdx < 0 || monthIdx > 11) return v;
  return `${MONTH_NAMES_EN[monthIdx]} ${y}`;
}

export function formatDateRange(start, end) {
  const s = formatYearMonth(start);
  const e = end === 'Present' || /present/i.test(String(end || '')) ? 'Present' : formatYearMonth(end);
  return [s, e].filter(Boolean).join(' — ');
}
