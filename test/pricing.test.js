import test from 'node:test';
import assert from 'node:assert/strict';
import { quoteRent } from '../src/js/pricing.js';

const rent = {
  dailyInLusakaZmw: 600,
  dailyOutOfTownZmw: 780,
  weeklyInLusakaZmw: 3600,
  weeklyOutOfTownZmw: 4700,
  monthlyInLusakaZmw: 11500,
  monthlyOutOfTownZmw: 15000,
  depositZmw: 2000,
  unavailableDates: ['2026-11-04', '2026-11-05', '2026-11-06'],
};

test('a short stay uses the daily rate and spots booked days', () => {
  const quote = quoteRent(rent, '2026-11-02', '2026-11-05', 'in');
  assert.equal(quote.days, 3);
  assert.equal(quote.total, 1800);
  assert.equal(quote.deposit, 2000);
  assert.deepEqual(quote.clashes, ['2026-11-04']);
  assert.equal(quote.available, false);
});

test('seven days or more uses weekly blocks plus leftover days', () => {
  const quote = quoteRent(rent, '2026-11-10', '2026-11-20', 'in');
  assert.equal(quote.days, 10);
  assert.equal(quote.total, 5400);
  assert.equal(quote.available, true);
  assert.equal(quote.otherTotal, 7040);
});

test('thirty days or more uses the monthly rate', () => {
  const quote = quoteRent({ ...rent, unavailableDates: [] }, '2026-11-01', '2026-12-03', 'out');
  assert.equal(quote.days, 32);
  assert.equal(quote.total, 16560);
  assert.equal(quote.areaLabel, 'Out of town');
});

test('the return day is not charged', () => {
  assert.equal(quoteRent(rent, '2026-11-10', '2026-11-10', 'in'), null);
});
