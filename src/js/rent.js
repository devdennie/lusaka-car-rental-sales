import './site.js';
import { rentCard } from './cards.js';
import { scrollToId } from './dom.js';
import { formatStay, todayIso } from './format.js';
import { quoteRent } from './pricing.js';
import { mountQuote } from './quote.js';
import { loadStock } from './stock.js';

const fleet = document.getElementById('fleet');
const quoteRoot = document.getElementById('quote');
const summary = document.getElementById('search-summary');
const form = document.getElementById('fleet-search');
const areaInput = document.getElementById('fleet-area');
const startInput = document.getElementById('fleet-start');
const endInput = document.getElementById('fleet-end');

loadStock()
  .then(({ cars }) => {
    const rentals = cars.filter((car) => car.forRent && car.rent);
    const params = new URLSearchParams(window.location.search);
    const quote = mountQuote(quoteRoot, {
      cars: rentals,
      initialId: params.get('car') || rentals[0]?.id,
      heading: false,
      initialStart: params.get('start') || '',
      initialEnd: params.get('end') || '',
      initialArea: params.get('area') || 'in',
      initialAirport: params.get('airport') === '1',
    });

    const today = todayIso();
    if (startInput && endInput) {
      startInput.min = today;
      endInput.min = today;
      startInput.addEventListener('change', () => {
        endInput.min = startInput.value || today;
      });
    }
    if (form) {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const next = readForm();
        if (next.start && next.end && next.end < next.start) {
          writeSummary({ error: 'The return date has to be on or after the pick-up date.' });
          return;
        }
        const url = new URL(window.location.href);
        url.searchParams.set('area', next.area);
        if (next.start) url.searchParams.set('start', next.start);
        else url.searchParams.delete('start');
        if (next.end) url.searchParams.set('end', next.end);
        else url.searchParams.delete('end');
        window.history.replaceState({}, '', url);
        render(rentals, quote, next);
        syncQuote(next);
      });
    }

    const initial = {
      area: params.get('area') === 'out' ? 'out' : 'in',
      start: params.get('start') || '',
      end: params.get('end') || '',
    };
    if (areaInput) areaInput.value = initial.area;
    if (startInput && initial.start) startInput.value = initial.start;
    if (endInput && initial.end) endInput.value = initial.end;
    render(rentals, quote, initial);
  })
  .catch(() => {
    fleet.textContent = 'Sample cars could not be loaded. You can still WhatsApp or call.';
  });

function readForm() {
  return {
    area: areaInput?.value === 'out' ? 'out' : 'in',
    start: startInput?.value || '',
    end: endInput?.value || '',
  };
}

function render(rentals, quote, search) {
  const stay = search.start && search.end ? quoteRent(rentals[0].rent, search.start, search.end, search.area) : null;
  if (search.start && search.end && !stay) {
    writeSummary({ error: 'The return date has to be on or after the pick-up date.' });
    paintFleet(rentals, quote, null, search);
    return;
  }
  const ranked = rentals.map((car) => ({
    car,
    quote: stay ? quoteRent(car.rent, search.start, search.end, search.area) : null,
  }));
  if (stay) {
    ranked.sort((a, b) => {
      if (a.quote.available !== b.quote.available) return a.quote.available ? -1 : 1;
      return a.quote.total - b.quote.total;
    });
  } else {
    ranked.sort((a, b) => a.car.rent.dailyInLusakaZmw - b.car.rent.dailyInLusakaZmw);
  }
  writeSummary({ stay, search, ranked });
  paintFleet(ranked, quote, stay, search);
}

function paintFleet(ranked, quote, stay, search) {
  const rows = Array.isArray(ranked) && ranked[0]?.car ? ranked : ranked.map((car) => ({ car, quote: null }));
  const free = stay ? rows.filter((row) => row.quote.available) : rows;
  const busy = stay ? rows.filter((row) => !row.quote.available) : [];
  const blocks = [];
  if (stay) {
    blocks.push(group(free.length ? 'Free for these dates' : 'No sample cars are free for these dates', free, quote, stay, search));
    if (busy.length) blocks.push(group('Not free for these dates', busy, quote, stay, search));
  } else {
    blocks.push(elCards(rows, quote, null, search));
  }
  fleet.replaceChildren(...blocks);
}

function group(title, rows, quote, stay, search) {
  return elSection(title, elCards(rows, quote, stay, search));
}

function elSection(title, cards) {
  const section = document.createElement('section');
  section.className = 'fleet-group';
  const heading = document.createElement('h2');
  heading.textContent = title;
  section.append(heading, cards);
  return section;
}

function elCards(rows, quote, stay, search) {
  const wrap = document.createElement('div');
  wrap.className = 'cards';
  if (!rows.length) {
    const empty = document.createElement('p');
    empty.textContent = 'No sample cars are free for these dates.';
    wrap.append(empty);
    return wrap;
  }
  const label = stay ? formatStay(search.start, search.end, stay.days) : '';
  wrap.append(...rows.map((row) => rentCard(row.car, {
    onSelect(id) {
      quote.selectCar(id);
      syncQuote(search);
      scrollToId('quote');
    },
    stay: stay ? { quote: row.quote, start: search.start, end: search.end, label } : null,
  })));
  return wrap;
}

function writeSummary({ stay, search, ranked, error }) {
  if (!summary) return;
  summary.hidden = false;
  summary.replaceChildren();
  if (error) {
    const p = document.createElement('p');
    p.className = 'warn';
    p.textContent = error;
    summary.append(p);
    return;
  }
  if (!stay) {
    summary.hidden = true;
    return;
  }
  const free = ranked.filter((row) => row.quote.available).length;
  const where = search.area === 'out' ? 'Out of town' : 'In Lusaka';
  const p = document.createElement('p');
  p.textContent = `${where}. ${formatStay(search.start, search.end, stay.days)}. ${free} of ${ranked.length} sample cars are free. Totals on the cards use this location.`;
  summary.append(p);
}

function syncQuote(search) {
  const start = document.getElementById('quote-start');
  const end = document.getElementById('quote-end');
  const radio = document.querySelector(`#quote-form input[name="area"][value="${search.area === 'out' ? 'out' : 'in'}"]`);
  if (start && search.start) start.value = search.start;
  if (end && search.end) end.value = search.end;
  if (radio) radio.checked = true;
  start?.dispatchEvent(new Event('change', { bubbles: true }));
}
