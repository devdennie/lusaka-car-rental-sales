import './site.js';
import { rentCard, saleCard } from './cards.js';
import { todayIso } from './format.js';
import { loadStock } from './stock.js';

const saleRoot = document.getElementById('home-sale');
const rentRoot = document.getElementById('home-rent');
const stats = document.getElementById('stats');

loadStock()
  .then(({ cars }) => {
    const sale = cars.filter((car) => car.homeSale && car.forSale && car.sale);
    const rent = cars.filter((car) => car.homeRent && car.forRent && car.rent);
    saleRoot.replaceChildren(...sale.map(saleCard));
    rentRoot.replaceChildren(...rent.map((car) => rentCard(car)));
    saleRoot.removeAttribute('aria-busy');
    rentRoot.removeAttribute('aria-busy');
    if (stats) {
      const forSale = cars.filter((car) => car.forSale && car.sale).length;
      const forRent = cars.filter((car) => car.forRent && car.rent).length;
      stats.replaceChildren(
        stat(String(cars.length), 'Cars in this sample'),
        stat(String(forSale), 'Listed for sale'),
        stat(String(forRent), 'Listed for rent'),
        stat('7', 'Days a week in this demo'),
      );
    }
  })
  .catch(() => {
    const message = 'Sample cars could not be loaded. You can still WhatsApp or call.';
    saleRoot.textContent = message;
    rentRoot.textContent = message;
  });

const findForm = document.getElementById('find-form');
const findStart = document.getElementById('find-start');
const findEnd = document.getElementById('find-end');
const findNote = document.getElementById('find-note');
if (findForm && findStart && findEnd) {
  const today = todayIso();
  findStart.min = today;
  findEnd.min = today;
  findStart.addEventListener('change', () => {
    findEnd.min = findStart.value || today;
  });
  findForm.addEventListener('submit', (event) => {
    const start = findStart.value;
    const end = findEnd.value;
    if (start && end && end < start) {
      event.preventDefault();
      if (findNote) findNote.hidden = false;
      findEnd.focus();
      return;
    }
    if (findNote) findNote.hidden = true;
  });
}

const promo = document.querySelector('[data-promo-end]');
if (promo) {
  const end = Date.parse(promo.dataset.promoEnd);
  const clock = promo.querySelector('[data-promo-clock]');
  const done = promo.querySelector('[data-promo-done]');
  const units = {
    days: promo.querySelector('[data-unit="days"]'),
    hours: promo.querySelector('[data-unit="hours"]'),
    minutes: promo.querySelector('[data-unit="minutes"]'),
    seconds: promo.querySelector('[data-unit="seconds"]'),
  };
  const paint = () => {
    const remaining = end - Date.now();
    if (!Number.isFinite(end) || remaining <= 0) {
      if (clock) clock.hidden = true;
      if (done) done.hidden = false;
      return;
    }
    const days = Math.floor(remaining / 86400000);
    const hours = Math.floor((remaining % 86400000) / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    units.days.textContent = String(days);
    units.hours.textContent = String(hours).padStart(2, '0');
    units.minutes.textContent = String(minutes).padStart(2, '0');
    units.seconds.textContent = String(seconds).padStart(2, '0');
  };
  paint();
  window.setInterval(paint, 1000);
}

function stat(value, label) {
  const item = document.createElement('li');
  const strong = document.createElement('strong');
  strong.textContent = value;
  item.append(strong, document.createTextNode(label));
  return item;
}
