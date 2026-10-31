import './site.js';
import { rentCard, saleCard } from './cards.js';
import { loadStock } from './stock.js';

const saleRoot = document.getElementById('home-sale');
const rentRoot = document.getElementById('home-rent');

loadStock()
  .then(({ cars }) => {
    const sale = cars.filter((car) => car.homeSale && car.forSale && car.sale);
    const rent = cars.filter((car) => car.homeRent && car.forRent && car.rent);
    saleRoot.replaceChildren(...sale.map(saleCard));
    rentRoot.replaceChildren(...rent.map((car) => rentCard(car)));
    saleRoot.removeAttribute('aria-busy');
    rentRoot.removeAttribute('aria-busy');
  })
  .catch(() => {
    const message = 'Sample cars could not be loaded. You can still WhatsApp or call.';
    saleRoot.textContent = message;
    rentRoot.textContent = message;
  });
