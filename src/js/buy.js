import './site.js';
import { saleCard } from './cards.js';
import { loadStock } from './stock.js';

const form = document.getElementById('filters');
const list = document.getElementById('car-list');
const count = document.getElementById('result-count');
const statusRank = { available: 0, reserved: 1, sold: 2 };

loadStock()
  .then(({ cars }) => {
    const stock = cars
      .filter((car) => car.forSale && car.sale)
      .sort((a, b) => statusRank[a.sale.status] - statusRank[b.sale.status] || a.sale.priceZmw - b.sale.priceZmw);
    fill('filter-make', stock.map((car) => car.make));
    fill('filter-body', stock.map((car) => car.bodyType));
    fill('filter-gear', stock.map((car) => car.gearbox));
    fill('filter-fuel', stock.map((car) => car.fuel));
    const apply = () => render(stock);
    form.addEventListener('change', apply);
    form.addEventListener('reset', () => {
      window.setTimeout(apply, 0);
    });
    form.addEventListener('submit', (event) => event.preventDefault());
    apply();
  })
  .catch(() => {
    list.textContent = 'Sample cars could not be loaded. You can still WhatsApp or call.';
  });

function fill(id, values) {
  const select = document.getElementById(id);
  for (const value of [...new Set(values)].sort((a, b) => a.localeCompare(b))) {
    select.add(new Option(value, value));
  }
}

function render(stock) {
  const filters = new FormData(form);
  const make = filters.get('make');
  const body = filters.get('body');
  const gear = filters.get('gear');
  const fuel = filters.get('fuel');
  const price = filters.get('price');
  const year = filters.get('year');
  const matched = stock.filter((car) => {
    if (make && car.make !== make) return false;
    if (body && car.bodyType !== body) return false;
    if (gear && car.gearbox !== gear) return false;
    if (fuel && car.fuel !== fuel) return false;
    if (!inPrice(car.sale.priceZmw, price)) return false;
    if (!inYear(car.year, year)) return false;
    return true;
  });
  count.textContent = matched.length === 1 ? '1 sample car' : `${matched.length} sample cars`;
  if (!matched.length) {
    list.replaceChildren();
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'No sample cars match these filters.';
    list.append(empty);
    return;
  }
  list.replaceChildren(...matched.map(saleCard));
}

function inPrice(amount, band) {
  if (!band) return true;
  if (band === '0-100') return amount < 100000;
  if (band === '100-200') return amount >= 100000 && amount < 200000;
  if (band === '200-400') return amount >= 200000 && amount < 400000;
  if (band === '400-800') return amount >= 400000 && amount < 800000;
  if (band === '800') return amount >= 800000;
  return true;
}

function inYear(year, band) {
  if (!band) return true;
  if (band === '2020') return year >= 2020;
  if (band === '2016') return year >= 2016 && year <= 2019;
  if (band === '2015') return year <= 2015;
  return true;
}
