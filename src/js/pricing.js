/** Days the car is out. The return date is the day it comes back, so it is not charged. */
export function daysBetween(startIso, endIso) {
  const start = Date.parse(`${startIso}T00:00:00Z`);
  const end = Date.parse(`${endIso}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  return Math.round((end - start) / 86400000);
}

export function stayDates(startIso, endIso) {
  const days = daysBetween(startIso, endIso);
  if (days < 1) return [];
  const [year, month, day] = startIso.split('-').map(Number);
  const dates = [];
  for (let i = 0; i < days; i += 1) {
    const date = new Date(Date.UTC(year, month - 1, day + i));
    dates.push(date.toISOString().slice(0, 10));
  }
  return dates;
}

export function rateSet(rent, area) {
  const out = area === 'out';
  return {
    area: out ? 'out' : 'in',
    label: out ? 'Out of town' : 'In Lusaka',
    daily: out ? rent.dailyOutOfTownZmw : rent.dailyInLusakaZmw,
    weekly: out ? rent.weeklyOutOfTownZmw : rent.weeklyInLusakaZmw,
    monthly: out ? rent.monthlyOutOfTownZmw : rent.monthlyInLusakaZmw,
  };
}

/** Price a stay with monthly, then weekly, then daily blocks. */
export function priceStay(days, daily, weekly, monthly) {
  const parts = [];
  const push = (unit, count, rate) => {
    if (count > 0) parts.push({ unit, count, rate });
  };
  if (days >= 30) {
    const months = Math.floor(days / 30);
    let remainder = days % 30;
    push('month', months, monthly);
    const weeks = Math.floor(remainder / 7);
    remainder %= 7;
    push('week', weeks, weekly);
    push('day', remainder, daily);
  } else if (days >= 7) {
    push('week', Math.floor(days / 7), weekly);
    push('day', days % 7, daily);
  } else {
    push('day', days, daily);
  }
  const total = parts.reduce((sum, part) => sum + part.count * part.rate, 0);
  return { total, parts };
}

export function quoteRent(rent, startIso, endIso, area) {
  const days = daysBetween(startIso, endIso);
  if (days < 1) return null;
  const chosen = rateSet(rent, area);
  const other = rateSet(rent, area === 'out' ? 'in' : 'out');
  const priced = priceStay(days, chosen.daily, chosen.weekly, chosen.monthly);
  const otherPriced = priceStay(days, other.daily, other.weekly, other.monthly);
  const needed = new Set(stayDates(startIso, endIso));
  const clashes = (rent.unavailableDates || []).filter((date) => needed.has(date));
  return {
    days,
    area: chosen.area,
    areaLabel: chosen.label,
    daily: chosen.daily,
    total: priced.total,
    parts: priced.parts,
    otherLabel: other.label,
    otherTotal: otherPriced.total,
    deposit: rent.depositZmw,
    clashes,
    available: clashes.length === 0,
  };
}
