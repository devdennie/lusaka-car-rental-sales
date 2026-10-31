import './site.js';
import { media } from './config.js';
import { el } from './dom.js';

const list = document.getElementById('credit-list');

fetch(media('data/image-credits.json'))
  .then((response) => {
    if (!response.ok) throw new Error('credits');
    return response.json();
  })
  .then((credits) => {
    list.replaceChildren(...credits.map((credit) => el('li', {}, [
      el('a', { href: credit.url }, credit.title),
      ` — ${credit.author}. ${credit.license}.`,
      credit.note ? ` ${credit.note}` : '',
    ])));
  })
  .catch(() => {
    list.textContent = 'Image credits could not be loaded. They are also listed in the README.';
  });
