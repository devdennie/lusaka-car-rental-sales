import { TEL_NUMBER, WHATSAPP_NUMBER } from './config.js';
import { carName, formatDate, formatZmw } from './format.js';

// PLACEHOLDER. wa.me and tel links below use the fake number from config.js.
export function waLink(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export const telHref = `tel:${TEL_NUMBER}`;

export function saleMessage(car) {
  const name = carName(car);
  const price = formatZmw(car.sale.priceZmw);
  if (car.sale.status === 'sold') {
    return `Hello ZedDrive Motors, the ${name} is marked sold on the demo site. I would like to ask about a similar car. Sample price shown: ${price}.`;
  }
  if (car.sale.status === 'reserved') {
    return `Hello ZedDrive Motors, I would like to ask about the ${name} (sample listing, marked reserved). Price shown: ${price}.`;
  }
  return `Hello ZedDrive Motors, I would like to ask about the ${name} (sample listing). Price shown: ${price}.`;
}

export function listedRentMessage(car) {
  const rates = car.rent;
  return [
    `Hello ZedDrive Motors, I would like to ask about renting the ${carName(car)} (sample listing).`,
    `In Lusaka: ${formatZmw(rates.dailyInLusakaZmw)} per day, ${formatZmw(rates.weeklyInLusakaZmw)} per week, ${formatZmw(rates.monthlyInLusakaZmw)} per month (sample).`,
    `Out of town: ${formatZmw(rates.dailyOutOfTownZmw)} per day (sample).`,
    `Refundable deposit shown: ${formatZmw(rates.depositZmw)} (sample).`,
  ].join('\n');
}

export function rentQuoteMessage({ car, quote, start, end, drive, airport, method }) {
  const lines = [
    'Hello ZedDrive Motors,',
    `I would like to rent the ${carName(car)} (sample listing).`,
  ];
  if (quote && start && end) {
    lines.push(`Dates: ${formatDate(start)} to ${formatDate(end)} (${quote.days} days, ${quote.areaLabel}).`);
    lines.push(`Total: ${formatZmw(quote.total)} (sample).`);
    lines.push(`Refundable deposit: ${formatZmw(quote.deposit)} (sample).`);
    if (!quote.available) {
      lines.push('The sample calendar shows some of these days as booked. Please confirm.');
    }
  } else {
    lines.push(...listedRentMessage(car).split('\n').slice(1));
  }
  if (drive) lines.push(`Drive: ${drive}.`);
  if (typeof airport === 'boolean') {
    lines.push(`Airport pick-up at Kenneth Kaunda International: ${airport ? 'Yes' : 'No'}.`);
  }
  if (method) {
    lines.push(`Demo deposit screen only — no payment was made. Method shown: ${method}.`);
  }
  return lines.join('\n');
}
