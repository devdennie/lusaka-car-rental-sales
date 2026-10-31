import { page, PHONE_DISPLAY } from './config.js';
import { el } from './dom.js';
import { carName, formatKm, formatZmw } from './format.js';
import { photo } from './stock.js';
import { listedRentMessage, saleMessage, telHref, waLink } from './whatsapp.js';

const CHAT = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 16.5 4 20l3.6-1A8 8 0 1 0 5 16.5Z" stroke-linejoin="round"/></svg>';

function icon(svg) {
  const span = document.createElement('span');
  span.className = 'icon';
  span.innerHTML = svg;
  return span;
}

function photoLink(car, href) {
  const img = el('img', {
    src: photo(car),
    alt: `Sample photo of a ${car.colour.toLowerCase()} ${car.year} ${car.make} ${car.model}`,
    width: '960',
    height: '640',
    loading: 'lazy',
    decoding: 'async',
  });
  return el('a', { class: 'card-photo', href }, [
    img,
    el('span', { class: 'tag tag-photo' }, 'Sample photo'),
  ]);
}

function badgeRow(car, { status } = {}) {
  const badges = [el('span', { class: 'tag' }, 'Sample listing')];
  if (status) badges.push(el('span', { class: `badge badge-${status}` }, statusLabel(status)));
  if (car.inspected) badges.push(el('span', { class: 'badge badge-inspected' }, 'Inspected'));
  return el('div', { class: 'badge-row' }, badges);
}

function statusLabel(status) {
  if (status === 'available') return 'Available';
  if (status === 'reserved') return 'Reserved';
  if (status === 'sold') return 'Sold';
  return status;
}

export function saleCard(car) {
  const href = page(`car.html?id=${encodeURIComponent(car.id)}`);
  const status = car.sale.status;
  return el('article', { class: `card card-${status}` }, [
    photoLink(car, href),
    el('div', { class: 'card-body' }, [
      badgeRow(car, { status }),
      el('h3', {}, [el('a', { href }, carName(car))]),
      el('p', { class: 'meta' }, `${car.year} · ${car.bodyType}`),
      el('p', { class: 'meta' }, `${formatKm(car.mileageKm)} · ${car.gearbox} · ${car.fuel}`),
      el('p', { class: 'price' }, [
        el('span', {}, formatZmw(car.sale.priceZmw)),
        el('span', { class: 'tag' }, 'Sample'),
      ]),
      el('div', { class: 'card-actions' }, [
        el('a', { class: 'btn btn-wa', href: waLink(saleMessage(car)) }, [icon(CHAT), 'Ask about this car on WhatsApp']),
        el('a', { class: 'text-link', href }, 'View this car'),
      ]),
    ]),
  ]);
}

export function rentCard(car, { onSelect } = {}) {
  const href = page(`car.html?id=${encodeURIComponent(car.id)}#rent`);
  const rates = car.rent;
  const booked = rates.unavailableDates?.length || 0;
  const selectControl = onSelect
    ? el('button', { type: 'button', class: 'btn btn-ink', onclick: () => onSelect(car.id) }, 'Check dates and price')
    : el('a', { class: 'btn btn-ink', href: page(`rent.html?car=${encodeURIComponent(car.id)}#quote`) }, 'Check dates and price');
  return el('article', { class: 'card' }, [
    photoLink(car, href),
    el('div', { class: 'card-body' }, [
      badgeRow(car),
      el('h3', {}, [el('a', { href }, carName(car))]),
      el('p', { class: 'meta' }, `${car.seats} seats · ${car.gearbox} · ${car.fuel}`),
      el('dl', { class: 'rate-list' }, [
        rateItem('In Lusaka', `${formatZmw(rates.dailyInLusakaZmw)}/day`),
        rateItem('Out of town', `${formatZmw(rates.dailyOutOfTownZmw)}/day`),
        rateItem('Week in Lusaka', formatZmw(rates.weeklyInLusakaZmw)),
        rateItem('Month in Lusaka', formatZmw(rates.monthlyInLusakaZmw)),
        rateItem('Deposit', `${formatZmw(rates.depositZmw)} sample`),
      ]),
      el('p', { class: 'meta' }, booked ? `${booked} sample days booked` : 'No sample days booked'),
      rates.withDriver ? el('p', { class: 'meta' }, 'Driver available') : null,
      el('div', { class: 'card-actions' }, [
        selectControl,
        el('a', { class: 'btn btn-wa', href: waLink(listedRentMessage(car)) }, [icon(CHAT), 'Ask on WhatsApp']),
        el('a', { class: 'text-link', href }, 'View this car'),
      ]),
    ]),
  ]);
}

function rateItem(label, value) {
  return el('div', {}, [el('dt', {}, label), el('dd', {}, value)]);
}

export function callLink(className = 'btn btn-ghost') {
  return el('a', { class: className, href: telHref }, `Call ${PHONE_DISPLAY}`);
}
