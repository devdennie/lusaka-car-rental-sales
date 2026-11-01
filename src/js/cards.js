import { page, PHONE_DISPLAY } from './config.js';
import { el } from './dom.js';
import { carName, formatKm, formatZmw } from './format.js';
import { photo } from './stock.js';
import { listedRentMessage, rentQuoteMessage, saleMessage, telHref, waLink } from './whatsapp.js';

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

const SEAT = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="7" r="2.2"/><path d="M8 20v-4a4 4 0 0 1 8 0v4"/></svg>';
const GEAR = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/></svg>';
const FUEL = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M7 20V6h7v14M14 9h2a3 3 0 0 1 3 3v5a2 2 0 1 0 0 4"/></svg>';

function badgeRow(car, { status, extras = [] } = {}) {
  const badges = [el('span', { class: 'tag' }, 'Sample listing')];
  if (car.badge) {
    const kind = String(car.badge).toLowerCase().includes('promo') ? 'badge-promo' : 'badge-best';
    badges.push(el('span', { class: `badge ${kind}` }, car.badge));
  }
  extras.forEach((extra) => {
    if (extra) badges.push(extra);
  });
  if (status) badges.push(el('span', { class: `badge badge-${status}` }, statusLabel(status)));
  if (car.inspected) badges.push(el('span', { class: 'badge badge-inspected' }, 'Inspected'));
  return el('div', { class: 'badge-row' }, badges);
}

function specRow(car) {
  return el('ul', { class: 'spec-row' }, [
    el('li', {}, [icon(SEAT), `${car.seats} seats`]),
    el('li', {}, [icon(GEAR), car.gearbox]),
    el('li', {}, [icon(FUEL), car.fuel]),
  ]);
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
      el('p', { class: 'meta' }, `${car.year} · ${car.bodyType} · ${formatKm(car.mileageKm)}`),
      specRow(car),
      el('p', { class: 'price' }, [
        el('span', {}, formatZmw(car.sale.priceZmw)),
        el('span', { class: 'tag' }, 'Sample'),
      ]),
      car.forRent && car.rent ? el('p', { class: 'meta' }, 'Also available to rent') : null,
      el('div', { class: 'card-actions' }, [
        el('a', { class: 'btn btn-wa', href: waLink(saleMessage(car)) }, [icon(CHAT), 'Ask about this car on WhatsApp']),
        el('a', { class: 'text-link', href }, 'View this car'),
      ]),
    ]),
  ]);
}

export function rentCard(car, { onSelect, stay } = {}) {
  const href = page(`car.html?id=${encodeURIComponent(car.id)}#rent`);
  const rates = car.rent;
  const booked = rates.unavailableDates?.length || 0;
  const selectControl = onSelect
    ? el('button', { type: 'button', class: 'btn btn-gold', onclick: () => onSelect(car.id) }, 'Rent now')
    : el('a', { class: 'btn btn-gold', href: page(`rent.html?car=${encodeURIComponent(car.id)}#quote`) }, 'Rent now');
  const message = stay
    ? rentQuoteMessage({
      car,
      quote: stay.quote,
      start: stay.start,
      end: stay.end,
      drive: 'Self-drive',
      airport: false,
    })
    : listedRentMessage(car);
  const priceText = stay ? formatZmw(stay.quote.total) : `From ${formatZmw(rates.dailyInLusakaZmw)}/day`;
  const priceNote = stay
    ? (stay.quote.available ? stay.label : 'Not free for these dates')
    : null;
  return el('article', { class: `card${stay && !stay.quote.available ? ' card-unavailable' : ''}` }, [
    photoLink(car, href),
    el('div', { class: 'card-body' }, [
      badgeRow(car, {
        extras: car.forSale ? [el('span', { class: 'badge badge-best' }, 'Also for sale')] : [],
      }),
      el('h3', {}, [el('a', { href }, carName(car))]),
      specRow(car),
      el('p', { class: 'price' }, [
        el('span', {}, priceText),
        el('span', { class: 'tag' }, 'Sample'),
      ]),
      priceNote ? el('p', { class: 'meta' }, priceNote) : null,
      rateDetails(car),
      el('p', { class: 'meta' }, booked ? `${booked} sample days booked` : 'No sample days booked'),
      rates.withDriver ? el('p', { class: 'meta' }, 'Driver available') : null,
      el('div', { class: 'card-actions' }, [
        selectControl,
        el('a', { class: 'btn btn-wa', href: waLink(message) }, [icon(CHAT), 'Ask on WhatsApp']),
        el('a', { class: 'text-link', href }, 'View this car'),
      ]),
    ]),
  ]);
}

function rateDetails(car) {
  const rates = car.rent;
  const row = (label, inTown, outOfTown) => el('tr', {}, [
    el('th', { scope: 'row' }, label),
    el('td', {}, inTown),
    el('td', {}, outOfTown),
  ]);
  return el('details', { class: 'rate-details' }, [
    el('summary', {}, 'View rental rates'),
    el('table', { class: 'rates' }, [
      el('caption', {}, `Sample rates for the ${carName(car)}`),
      el('thead', {}, [
        el('tr', {}, [
          el('th', { scope: 'col' }, 'Rate'),
          el('th', { scope: 'col' }, 'In Lusaka'),
          el('th', { scope: 'col' }, 'Out of town'),
        ]),
      ]),
      el('tbody', {}, [
        row('Day', formatZmw(rates.dailyInLusakaZmw), formatZmw(rates.dailyOutOfTownZmw)),
        row('Week', formatZmw(rates.weeklyInLusakaZmw), formatZmw(rates.weeklyOutOfTownZmw)),
        row('Month', formatZmw(rates.monthlyInLusakaZmw), formatZmw(rates.monthlyOutOfTownZmw)),
      ]),
    ]),
    el('p', { class: 'deposit-line' }, `Refundable deposit ${formatZmw(rates.depositZmw)} (sample)`),
  ]);
}

export function callLink(className = 'btn btn-ghost') {
  return el('a', { class: className, href: telHref }, `Call ${PHONE_DISPLAY}`);
}
