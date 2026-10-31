import { media } from './config.js';

let cache;

export async function loadStock() {
  if (!cache) {
    const response = await fetch(media('data/stock.json'));
    if (!response.ok) throw new Error('Could not load sample stock');
    cache = await response.json();
  }
  return cache;
}

export function photo(car, index = 0) {
  const path = car.images?.[index];
  return path ? media(path) : '';
}
