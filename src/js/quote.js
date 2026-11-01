import { PHONE_DISPLAY } from './config.js';
import { renderCalendar } from './calendar.js';
import { el } from './dom.js';
import { carName, formatDate, formatStay, formatZmw, todayIso } from './format.js';
import { quoteRent } from './pricing.js';
import { rentQuoteMessage, telHref, waLink } from './whatsapp.js';

const CHAT = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 16.5 4 20l3.6-1A8 8 0 1 0 5 16.5Z" stroke-linejoin="round"/></svg>';

function icon(svg) {
  const span = document.createElement('span');
  span.className = 'icon';
  span.innerHTML = svg;
  return span;
}

export function mountQuote(root, { cars, initialId, lockCar = false, heading = true, initialStart = '', initialEnd = '', initialArea = 'in', initialAirport = false, noneFree = false }) {
  const today = todayIso();
  const state = {
    car: cars.find((car) => car.id === initialId) || cars[0],
    start: '',
    end: '',
    area: 'in',
    drive: 'Self-drive',
    airport: false,
    quote: null,
    noneFree,
    cursor: monthCursor(today),
  };

  const ratesHost = el('div');
  const result = el('div', { class: 'quote-result', 'aria-live': 'polite' });
  const calendarHost = el('div', { class: 'calendar' });
  const waLabel = document.createTextNode('Ask on WhatsApp');
  const wa = el('a', { class: 'btn btn-wa', href: waLink(rentQuoteMessage({ car: state.car })) }, [
    icon(CHAT),
    waLabel,
  ]);
  const depositBtn = el('button', { type: 'button', class: 'btn btn-ink', disabled: true }, 'Pay deposit to reserve');
  const carSelect = el('select', { name: 'car', id: 'quote-car' });
  if (!lockCar) {
    for (const car of cars) {
      carSelect.append(el('option', { value: car.id }, carName(car)));
    }
    carSelect.value = state.car.id;
  }

  const startInput = el('input', { type: 'date', name: 'start', id: 'quote-start', required: true, min: today });
  const endInput = el('input', { type: 'date', name: 'end', id: 'quote-end', required: true, min: today });

  const form = el('form', { class: 'quote', id: 'quote-form' }, [
    el('p', { class: 'eyebrow' }, 'Sample quote'),
    heading ? el('h2', {}, lockCar ? `Rent the ${carName(state.car)}` : 'Check dates and price') : null,
    ratesHost,
    lockCar ? null : field('Car', carSelect),
    el('div', { class: 'quote-dates' }, [
      field('Pick-up date', startInput),
      field('Return date', endInput),
    ]),
    el('p', { class: 'fine' }, 'Both the pick-up day and the return day are included. 6–10 Nov is 5 days. A same-day hire is 1 day.'),
    radios('Where will you drive?', 'area', [
      ['in', 'In Lusaka'],
      ['out', 'Out of town'],
    ], 'in'),
    radios('How do you want to drive?', 'drive', [
      ['Self-drive', 'Self-drive'],
      ['With a driver', 'With a driver'],
    ], 'Self-drive'),
    el('label', { class: 'checkline' }, [
      el('input', { type: 'checkbox', name: 'airport' }),
      'Airport pick-up at Kenneth Kaunda International',
    ]),
    result,
    el('div', { class: 'quote-actions' }, [
      wa,
      el('a', { class: 'btn btn-ghost', href: telHref }, `Call ${PHONE_DISPLAY}`),
      depositBtn,
    ]),
    el('p', { class: 'fine' }, 'This demo opens WhatsApp. Nothing is stored and no payment is taken.'),
  ]);

  root.replaceChildren(form, calendarHost);

  function read() {
    if (!lockCar) {
      state.car = cars.find((car) => car.id === carSelect.value) || cars[0];
    }
    state.start = startInput.value;
    state.end = endInput.value;
    state.area = form.querySelector('input[name="area"]:checked')?.value || 'in';
    state.drive = form.querySelector('input[name="drive"]:checked')?.value || 'Self-drive';
    state.airport = form.querySelector('input[name="airport"]').checked;
    endInput.min = state.start || today;
    state.quote = state.start && state.end ? quoteRent(state.car.rent, state.start, state.end, state.area) : null;
    if (state.start) {
      const [year, month] = state.start.split('-').map(Number);
      state.cursor = { year, month: month - 1 };
    }
    if (state.noneFree) {
      paintNone();
      return;
    }
    paint();
  }

  function paintNone() {
    if (!lockCar) {
      let blank = carSelect.querySelector('option[value=""]');
      if (!blank) {
        blank = el('option', { value: '' }, 'No car free');
        carSelect.prepend(blank);
      }
      carSelect.value = '';
    }
    ratesHost.replaceChildren();
    result.replaceChildren(el('p', { class: 'warn' }, 'No sample cars free for these dates.'));
    wa.href = waLink('Hello ZedDrive Motors, no sample cars are free for the dates I chose. This is the demo site.');
    waLabel.data = 'Ask on WhatsApp';
    depositBtn.disabled = true;
    calendarHost.replaceChildren();
  }

  function paint() {
    ratesHost.replaceChildren(rateTable(state.car));
    result.replaceChildren(...resultNodes(state));
    const message = rentQuoteMessage({
      car: state.car,
      quote: state.quote,
      start: state.start,
      end: state.end,
      drive: state.drive,
      airport: state.airport,
    });
    wa.href = waLink(message);
    waLabel.data = state.quote ? 'Ask about these dates on WhatsApp' : 'Ask on WhatsApp';
    depositBtn.disabled = !(state.quote && state.quote.available);
    paintCalendar();
  }

  function paintCalendar() {
    const min = monthCursor(today);
    const max = addMonths(min, 4);
    const cursor = clampMonth(state.cursor, min, max);
    state.cursor = cursor;
    renderCalendar(calendarHost, {
      year: cursor.year,
      month: cursor.month,
      booked: state.car.rent.unavailableDates,
      start: state.quote ? state.start : '',
      end: state.quote ? state.end : '',
      prevDisabled: sameMonth(cursor, min),
      nextDisabled: sameMonth(cursor, max),
      onPrev: () => {
        state.cursor = addMonths(state.cursor, -1);
        paintCalendar();
      },
      onNext: () => {
        state.cursor = addMonths(state.cursor, 1);
        paintCalendar();
      },
    });
  }

  depositBtn.addEventListener('click', () => {
    if (!state.quote || !state.quote.available) return;
    openDeposit({
      car: carName(state.car),
      amount: state.quote.deposit,
      messageFor: (method) => rentQuoteMessage({
        car: state.car,
        quote: state.quote,
        start: state.start,
        end: state.end,
        drive: state.drive,
        airport: state.airport,
        method,
      }),
    });
  });

  form.addEventListener('change', (event) => {
    if (event.target?.id === 'quote-car') state.noneFree = false;
    read();
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!state.quote) {
      form.reportValidity();
      return;
    }
    window.location.href = wa.href;
  });

  if (isIso(initialStart)) startInput.value = initialStart;
  if (isIso(initialEnd)) endInput.value = initialEnd;
  const areaRadio = form.querySelector(`input[name="area"][value="${initialArea === 'out' ? 'out' : 'in'}"]`);
  if (areaRadio) areaRadio.checked = true;
  const airportBox = form.querySelector('input[name="airport"]');
  if (airportBox) airportBox.checked = Boolean(initialAirport);

  read();

  return {
    selectCar(id) {
      if (lockCar || !id) return;
      state.noneFree = false;
      carSelect.value = id;
      read();
    },
    showNoneFree() {
      state.noneFree = true;
      paintNone();
    },
  };
}

function field(label, control) {
  const id = control.id;
  return el('label', { class: 'field', for: id }, [el('span', {}, label), control]);
}

function radios(legend, name, options, checked) {
  return el('fieldset', { class: 'choices segmented' }, [
    el('legend', {}, legend),
    el('div', { class: 'segment' }, options.map(([value, label]) => el('label', { class: 'choice' }, [
      el('input', { type: 'radio', name, value, checked: value === checked }),
      el('span', {}, label),
    ]))),
  ]);
}

function rateTable(car) {
  const rates = car.rent;
  const row = (label, left, right) => el('tr', {}, [
    el('th', { scope: 'row' }, label),
    el('td', {}, left),
    el('td', {}, right),
  ]);
  return el('div', {}, [
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
    el('p', { class: 'deposit-line' }, [
      `Refundable deposit ${formatZmw(rates.depositZmw)} `,
      el('span', { class: 'tag' }, 'Sample'),
    ]),
    el('p', { class: 'fine' }, rates.withDriver
      ? 'A driver is available on this sample car. Fuel is full to full.'
      : 'Listed as self-drive. You can still ask for a driver. Fuel is full to full.'),
  ]);
}

function resultNodes(state) {
  if (!state.start || !state.end) {
    return [el('p', {}, 'Pick a pick-up date and a return date to see the sample total.')];
  }
  if (!state.quote) {
    return [el('p', { class: 'warn' }, 'The return date has to be on or after the pick-up date.')];
  }
  const quote = state.quote;
  const parts = quote.parts.map(partText).join(' + ');
  const nodes = [
    el('p', { class: 'total' }, [
      `${quote.areaLabel} total ${formatZmw(quote.total)} `,
      el('span', { class: 'tag' }, 'Sample'),
    ]),
    el('p', {}, `${formatStay(state.start, state.end, quote.days)} · ${parts}`),
    el('p', {}, `${quote.areaLabel === 'In Lusaka' ? 'Out of town' : 'In Lusaka'} for the same dates: ${formatZmw(quote.otherTotal)} (sample).`),
    el('p', {}, `Refundable deposit ${formatZmw(quote.deposit)} (sample). This is not added to the rental total.`),
  ];
  if (quote.available) {
    nodes.push(el('p', { class: 'ok' }, 'Free for these dates on the sample calendar.'));
  } else {
    const days = quote.clashes.map(formatDate).join(', ');
    nodes.push(el('p', { class: 'warn' }, `Not free on the sample calendar (${days}). You can still ask on WhatsApp.`));
  }
  return nodes;
}

function partText(part) {
  const names = { month: 'month', week: 'week', day: 'day' };
  const word = part.count === 1 ? names[part.unit] : `${names[part.unit]}s`;
  return `${part.count} ${word} × ${formatZmw(part.rate)}`;
}

function isIso(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value || '');
}

function monthCursor(iso) {
  const [year, month] = iso.split('-').map(Number);
  return { year, month: month - 1 };
}

function addMonths(cursor, count) {
  const date = new Date(Date.UTC(cursor.year, cursor.month + count, 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() };
}

function sameMonth(a, b) {
  return a.year === b.year && a.month === b.month;
}

function clampMonth(cursor, min, max) {
  const value = cursor.year * 12 + cursor.month;
  const low = min.year * 12 + min.month;
  const high = max.year * 12 + max.month;
  if (value < low) return min;
  if (value > high) return max;
  return cursor;
}

let dialog;

function openDeposit({ car, amount, messageFor }) {
  if (!dialog) {
    dialog = el('dialog', { class: 'deposit', 'aria-labelledby': 'deposit-title' }, [
      el('p', { class: 'tag' }, 'Demo only — no payment is taken'),
      el('h2', { id: 'deposit-title' }, 'Pay deposit to reserve'),
      el('p', { id: 'deposit-copy' }),
      el('div', { class: 'pay-choices', role: 'group', 'aria-label': 'Mobile money, demo only' }, [
        el('button', { type: 'button', class: 'btn btn-ghost', 'data-method': 'MTN MoMo' }, 'MTN MoMo'),
        el('button', { type: 'button', class: 'btn btn-ghost', 'data-method': 'Airtel Money' }, 'Airtel Money'),
      ]),
      el('div', { class: 'momo', id: 'deposit-screen', hidden: true }, [
        el('p', { class: 'momo-kicker' }, 'Sample prompt'),
        el('p', { class: 'momo-brand', id: 'deposit-method' }),
        el('p', { class: 'momo-amount', id: 'deposit-amount' }),
        el('p', { id: 'deposit-car' }),
        el('p', {}, 'Nothing is charged. This screen does not ask for a number or a PIN, and it does not send anything until you choose WhatsApp.'),
        el('a', { class: 'btn btn-wa', id: 'deposit-wa' }, 'Send this reserve request on WhatsApp'),
      ]),
      el('button', { type: 'button', class: 'btn btn-ghost', id: 'deposit-close' }, 'Close'),
    ]);
    document.body.append(dialog);
    dialog.querySelector('#deposit-close').addEventListener('click', () => dialog.close());
  }

  dialog.querySelector('#deposit-copy').textContent = `Sample deposit ${formatZmw(amount)} for the ${car}. Choose a mobile-money button to see a fake prompt.`;
  dialog.querySelector('#deposit-amount').textContent = formatZmw(amount);
  dialog.querySelector('#deposit-car').textContent = car;
  const screen = dialog.querySelector('#deposit-screen');
  screen.hidden = true;
  dialog.querySelectorAll('[data-method]').forEach((button) => {
    button.setAttribute('aria-pressed', 'false');
    button.onclick = () => {
      dialog.querySelectorAll('[data-method]').forEach((other) => other.setAttribute('aria-pressed', 'false'));
      button.setAttribute('aria-pressed', 'true');
      const method = button.dataset.method;
      dialog.querySelector('#deposit-method').textContent = method;
      const link = dialog.querySelector('#deposit-wa');
      link.href = waLink(messageFor(method));
      screen.hidden = false;
    };
  });
  if (!dialog.open) dialog.showModal();
}
