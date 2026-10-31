import './site.js';
import { rentCard } from './cards.js';
import { scrollToId } from './dom.js';
import { mountQuote } from './quote.js';
import { loadStock } from './stock.js';

const fleet = document.getElementById('fleet');
const quoteRoot = document.getElementById('quote');

loadStock()
  .then(({ cars }) => {
    const rentals = cars
      .filter((car) => car.forRent && car.rent)
      .sort((a, b) => a.rent.dailyInLusakaZmw - b.rent.dailyInLusakaZmw);
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
    if (params.get('start') || params.get('end')) scrollToId('quote');
    fleet.replaceChildren(...rentals.map((car) => rentCard(car, {
      onSelect(id) {
        quote.selectCar(id);
        scrollToId('quote');
      },
    })));
  })
  .catch(() => {
    fleet.textContent = 'Sample cars could not be loaded. You can still WhatsApp or call.';
  });
