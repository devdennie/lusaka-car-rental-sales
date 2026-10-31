import './site.js';
import { callLink } from './cards.js';
import { page } from './config.js';
import { el } from './dom.js';
import { carName, formatKm, formatZmw } from './format.js';
import { mountQuote } from './quote.js';
import { loadStock, photo } from './stock.js';
import { listedRentMessage, saleMessage, waLink } from './whatsapp.js';

const CHECKS = [
  ['engine', 'Engine'],
  ['gearbox', 'Gearbox'],
  ['brakes', 'Brakes and handbrake'],
  ['tyres', 'Tyres and spare'],
  ['suspension', 'Suspension and steering'],
  ['lights', 'Lights and electrics'],
  ['body', 'Body and paint'],
  ['interior', 'Interior and air conditioning'],
  ['warnings', 'Dashboard warning lights'],
  ['papers', 'White book / registration papers'],
];

const root = document.getElementById('car-root');

loadStock()
  .then(({ cars }) => {
    const id = new URLSearchParams(window.location.search).get('id');
    const car = cars.find((item) => item.id === id);
    if (!car) {
      root.replaceChildren(missing());
      return;
    }
    document.title = `${carName(car)} | ZedDrive Motors`;
    root.replaceChildren(render(car));
    if (car.forRent && window.location.hash === '#rent') {
      window.requestAnimationFrame(() => {
        document.getElementById('rent')?.scrollIntoView({ block: 'start' });
      });
    }
  })
  .catch(() => {
    root.textContent = 'This sample car could not be loaded. You can still WhatsApp or call.';
  });

function missing() {
  return el('div', { class: 'empty-block' }, [
    el('h1', {}, 'Car not in the sample stock'),
    el('p', {}, 'Choose a car from the demo listings.'),
    el('div', { class: 'stack-actions' }, [
      el('a', { class: 'btn btn-ink', href: page('buy.html') }, 'View cars for sale'),
      el('a', { class: 'btn btn-ghost', href: page('rent.html') }, 'Rent a car'),
    ]),
  ]);
}

function render(car) {
  const quoteHost = el('div', { id: 'rent' });
  const layout = el('div', { class: 'detail' }, [
    gallery(car),
    side(car),
    el('div', { class: 'detail-more' }, [
      specs(car),
      el('section', { class: 'block' }, [
        el('h2', {}, 'Condition notes'),
        el('p', {}, car.conditionNotes),
      ]),
      inspection(car),
      car.forSale ? documents() : null,
      car.forRent ? rentSection(car, quoteHost) : null,
    ]),
  ]);
  if (car.forRent) {
    mountQuote(quoteHost, { cars: [car], initialId: car.id, lockCar: true });
  }
  layout.append(mobileBar(car));
  return layout;
}

function modeBadges(car) {
  if (car.forSale && car.forRent) {
    return [
      el('span', { class: 'badge badge-best' }, 'For sale'),
      el('span', { class: 'badge badge-rent' }, 'Also available to rent'),
    ];
  }
  if (car.forSale) return [el('span', { class: 'badge badge-best' }, 'For sale')];
  if (car.forRent) return [el('span', { class: 'badge badge-rent' }, 'For rent')];
  return [];
}

function rentPriceLine(car) {
  if (!car.forRent || !car.rent) return null;
  const inTown = formatZmw(car.rent.dailyInLusakaZmw);
  const outOfTown = formatZmw(car.rent.dailyOutOfTownZmw);
  const lead = car.forSale ? 'Also available to rent from' : 'From';
  return el('p', {}, [
    `${lead} ${inTown} a day in Lusaka, or ${outOfTown} out of town. `,
    el('span', { class: 'tag' }, 'Sample'),
  ]);
}

function mobileBar(car) {
  const forSale = car.forSale && car.sale;
  const price = forSale
    ? formatZmw(car.sale.priceZmw)
    : car.forRent && car.rent
      ? `From ${formatZmw(car.rent.dailyInLusakaZmw)}/day`
      : '';
  const message = forSale ? saleMessage(car) : listedRentMessage(car);
  return el('div', { class: 'detail-bar' }, [
    el('p', { class: 'detail-bar-price' }, [
      el('span', {}, price),
      el('span', { class: 'tag' }, 'Sample'),
    ]),
    el('a', { class: 'btn btn-wa', href: waLink(message) }, 'WhatsApp'),
  ]);
}

function side(car) {
  const links = [];
  if (car.forSale) links.push(el('a', { href: page('buy.html') }, 'Cars for sale'));
  if (car.forRent) links.push(el('a', { href: page('rent.html') }, 'Rental fleet'));
  const actions = [];
  if (car.forSale) {
    actions.push(el('a', { class: 'btn btn-wa', href: waLink(saleMessage(car)) }, 'Ask about this car on WhatsApp'));
  }
  if (car.forRent) {
    actions.push(el('a', { class: 'btn btn-wa', href: waLink(listedRentMessage(car)) }, car.forSale ? 'Ask about renting it' : 'Ask about this car on WhatsApp'));
  }
  actions.push(callLink());
  return el('div', { class: 'detail-side' }, [
    el('p', { class: 'back' }, join(links)),
    el('p', { class: 'tag' }, 'Sample listing'),
    el('h1', {}, carName(car)),
    el('div', { class: 'badge-row' }, [
      car.forSale ? el('span', { class: `badge badge-${car.sale.status}` }, label(car.sale.status)) : null,
      ...modeBadges(car),
      car.inspected ? el('span', { class: 'badge badge-inspected' }, 'Inspected') : null,
    ]),
    car.forSale ? el('p', { class: 'price price-lg' }, [
      el('span', {}, formatZmw(car.sale.priceZmw)),
      el('span', { class: 'tag' }, 'Sample'),
    ]) : null,
    rentPriceLine(car),
    el('div', { class: 'card-actions' }, actions),
    car.forSale ? el('p', {}, [
      'We help with trade-ins, and we can point you to financing partners. ',
      el('a', { href: page('contact.html?need=Trade-in') }, 'Ask about a trade-in'),
      '.',
    ]) : null,
  ]);
}

function gallery(car) {
  const images = car.images?.length ? car.images : [];
  const main = el('img', {
    class: 'gallery-main',
    src: photo(car),
    alt: altText(car, 1),
    width: '960',
    height: '640',
    decoding: 'async',
    fetchpriority: 'high',
  });
  const buttons = images.map((src, index) => {
    const button = el('button', {
      type: 'button',
      class: index === 0 ? 'is-current' : '',
      'aria-label': `Show sample photo ${index + 1}`,
    }, [
      el('img', { src: photo(car, index), alt: '', width: '120', height: '80' }),
    ]);
    if (index === 0) button.setAttribute('aria-current', 'true');
    button.addEventListener('click', () => {
      main.src = photo(car, index);
      main.alt = altText(car, index + 1);
      buttons.forEach((item) => {
        item.classList.remove('is-current');
        item.removeAttribute('aria-current');
      });
      button.classList.add('is-current');
      button.setAttribute('aria-current', 'true');
    });
    return button;
  });
  return el('div', { class: 'gallery' }, [
    main,
    el('p', { class: 'fine' }, 'Sample photo. Not a ZedDrive vehicle.'),
    images.length > 1 ? el('div', { class: 'thumbs' }, buttons) : null,
  ]);
}

function specs(car) {
  const rows = [
    ['Year', String(car.year)],
    ['Mileage', formatKm(car.mileageKm)],
    ['Body', car.bodyType],
    ['Gearbox', car.gearbox],
    ['Fuel', car.fuel],
    ['Engine', car.engine],
    ['Drive', car.drive],
    ['Colour', car.colour],
    ['Seats', String(car.seats)],
  ];
  return el('section', { class: 'block' }, [
    el('h2', {}, 'Specifications'),
    el('dl', { class: 'specs' }, rows.map(([name, value]) => el('div', {}, [
      el('dt', {}, name),
      el('dd', {}, value),
    ]))),
  ]);
}

function inspection(car) {
  const notes = car.inspectionNotes || {};
  return el('section', { class: 'block' }, [
    el('h2', {}, 'Inspection checklist'),
    el('p', { class: 'fine' }, 'Sample checklist for this demo. Not a real inspection report.'),
    el('ul', { class: 'checks' }, CHECKS.map(([key, name]) => {
      const note = notes[key];
      return el('li', {}, [
        el('span', {}, name),
        el('span', { class: note ? 'check-note' : 'check-pass' }, note ? `Note — ${note}` : 'Pass'),
      ]);
    })),
  ]);
}

function documents() {
  return el('section', { class: 'block' }, [
    el('h2', {}, 'Papers'),
    el('p', {}, 'Inspected before sale. On a real sale we would help with the white book and the registration transfer. This line is sample wording.'),
  ]);
}

function rentSection(car, quoteHost) {
  return el('section', { class: 'block' }, [
    el('h2', {}, 'Rent this car'),
    el('p', {}, 'A stay of 7 days or more uses the weekly rate. 30 days or more uses the monthly rate. Sample prices, shown for in Lusaka and out of town.'),
    quoteHost,
  ]);
}

function altText(car, index) {
  return `Sample photo ${index} of a ${car.colour.toLowerCase()} ${car.year} ${car.make} ${car.model}`;
}

function label(status) {
  if (status === 'available') return 'Available';
  if (status === 'reserved') return 'Reserved';
  if (status === 'sold') return 'Sold';
  return status;
}

function join(links) {
  const nodes = [];
  links.forEach((link, index) => {
    if (index) nodes.push(' · ');
    nodes.push(link);
  });
  return nodes;
}
