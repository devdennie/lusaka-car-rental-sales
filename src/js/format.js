export function formatZmw(amount) {
  return `K${new Intl.NumberFormat('en-US').format(amount)}`;
}

export function formatKm(km) {
  return `${new Intl.NumberFormat('en-US').format(km)} km`;
}

export function carName(car) {
  return `${car.year} ${car.make} ${car.model}`;
}

/** "5 days, 6 Nov 2026 – 10 Nov 2026", or "1 day, 6 Nov 2026" for a same-day hire. */
export function formatStay(start, end, days) {
  const count = days === 1 ? '1 day' : `${days} days`;
  const when = start === end ? formatDate(start) : `${formatDate(start)} – ${formatDate(end)}`;
  return `${count}, ${when}`;
}

export function formatDate(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function todayIso() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export function addDays(iso, days) {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}
