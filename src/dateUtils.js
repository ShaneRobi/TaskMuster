export function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function fromDateStr(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function today() {
  return toDateStr(new Date());
}

export function todayInTimeZone(timeZone = 'Asia/Singapore', date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function formatDisplay(dateStr) {
  const d = fromDateStr(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

export function addDays(dateStr, n) {
  const d = fromDateStr(dateStr);
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}

export function yearDays(year) {
  const days = [];
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(toDateStr(new Date(d)));
  }
  return days;
}

export function startOfWeek(dateStr) {
  const d = fromDateStr(dateStr);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return toDateStr(d);
}

export function isoWeek(dateStr) {
  return startOfWeek(dateStr);
}
