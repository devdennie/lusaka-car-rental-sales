import test from 'node:test';
import assert from 'node:assert/strict';
import { quoteRent, stayDates } from '../src/js/pricing.js';
import { formatStay } from '../src/js/format.js';

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

test('6–10 Nov includes both ends and is 5 days', () => {
  const quote = quoteRent(rent, '2026-11-06', '2026-11-10', 'in');
  assert.deepEqual(stayDates('2026-11-06', '2026-11-10'), [
    '2026-11-06',
    '2026-11-07',
    '2026-11-08',
    '2026-11-09',
    '2026-11-10',
  ]);
  assert.equal(quote.days, 5);
  assert.equal(quote.total, 3000);
  assert.deepEqual(quote.clashes, ['2026-11-06']);
  assert.equal(formatStay('2026-11-06', '2026-11-10', quote.days), '5 days, 6 Nov 2026 – 10 Nov 2026');
});

test('a same-day rental is one day', () => {
  const quote = quoteRent(rent, '2026-11-10', '2026-11-10', 'in');
  assert.deepEqual(stayDates('2026-11-10', '2026-11-10'), ['2026-11-10']);
  assert.equal(quote.days, 1);
  assert.equal(quote.total, 600);
  assert.equal(quote.available, true);
  assert.equal(formatStay('2026-11-10', '2026-11-10', quote.days), '1 day, 10 Nov 2026');
});

test('a range across a month boundary includes every day', () => {
  const quote = quoteRent({ ...rent, unavailableDates: [] }, '2026-11-30', '2026-12-02', 'in');
  assert.deepEqual(stayDates('2026-11-30', '2026-12-02'), ['2026-11-30', '2026-12-01', '2026-12-02']);
  assert.equal(quote.days, 3);
  assert.equal(quote.total, 1800);
});

test('an end date before the start is not a quote', () => {
  assert.equal(quoteRent(rent, '2026-11-10', '2026-11-06', 'in'), null);
  assert.deepEqual(stayDates('2026-11-10', '2026-11-06'), []);
});

test('seven days or more uses weekly blocks plus leftover days', () => {
  const quote = quoteRent(rent, '2026-11-10', '2026-11-19', 'in');
  assert.equal(quote.days, 10);
  assert.equal(quote.total, 5400);
  assert.equal(quote.available, true);
  assert.equal(quote.otherTotal, 7040);
});

test('thirty days or more uses the monthly rate', () => {
  const quote = quoteRent({ ...rent, unavailableDates: [] }, '2026-11-01', '2026-12-02', 'out');
  assert.equal(quote.days, 32);
  assert.equal(quote.total, 16560);
  assert.equal(quote.areaLabel, 'Out of town');
});
