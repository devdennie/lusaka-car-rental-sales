import { el } from './dom.js';
import { formatDate } from './format.js';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function monthCells(year, monthIndex) {
  const first = new Date(Date.UTC(year, monthIndex, 1));
  const pad = (first.getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const cells = Array(pad).fill(null);
  for (let day = 1; day <= count; day += 1) {
    const month = String(monthIndex + 1).padStart(2, '0');
    const date = String(day).padStart(2, '0');
    cells.push(`${year}-${month}-${date}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function renderCalendar(container, { year, month, booked, start, end, onPrev, onNext, prevDisabled, nextDisabled }) {
  const bookedSet = new Set(booked || []);
  const caption = new Date(Date.UTC(year, month, 1)).toLocaleString('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const table = el('table', { class: 'cal' }, [
    el('caption', {}, `Sample availability, ${caption}`),
    el('thead', {}, [
      el('tr', {}, WEEKDAYS.map((day) => el('th', { scope: 'col' }, day))),
    ]),
    el('tbody', {}, rows(monthCells(year, month)).map((week) => el('tr', {}, week.map((iso) => cell(iso, bookedSet, start, end))))),
  ]);
  container.replaceChildren(
    el('div', { class: 'cal-nav' }, [
      el('button', { type: 'button', class: 'btn btn-ghost btn-small', disabled: prevDisabled, 'aria-label': 'Previous month', onclick: onPrev }, 'Previous'),
      el('p', { class: 'cal-title' }, caption),
      el('button', { type: 'button', class: 'btn btn-ghost btn-small', disabled: nextDisabled, 'aria-label': 'Next month', onclick: onNext }, 'Next'),
    ]),
    table,
    el('ul', { class: 'cal-key' }, [
      el('li', {}, [el('span', { class: 'swatch swatch-free', 'aria-hidden': 'true' }), 'Free']),
      el('li', {}, [el('span', { class: 'swatch swatch-booked', 'aria-hidden': 'true' }), 'Booked (sample)']),
      el('li', {}, [el('span', { class: 'swatch swatch-range', 'aria-hidden': 'true' }), 'Your dates']),
    ]),
  );
}

function rows(cells) {
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

function cell(iso, bookedSet, start, end) {
  if (!iso) return el('td', {});
  const booked = bookedSet.has(iso);
  const inRange = Boolean(start && end && iso >= start && iso <= end);
  const classes = ['cal-day'];
  if (inRange) classes.push('is-range');
  if (booked) classes.push('is-booked');
  const day = Number(iso.slice(-2));
  const state = inRange && booked ? 'in your dates, booked' : booked ? 'booked' : inRange ? 'in your dates' : 'free';
  const label = `${formatDate(iso)}, ${state}`;
  return el('td', { class: classes.join(' ') }, [
    el('span', { class: 'vh' }, label),
    el('span', { 'aria-hidden': 'true' }, String(day)),
  ]);
}
