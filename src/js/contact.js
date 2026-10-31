import './site.js';
import { waLink } from './whatsapp.js';

const form = document.getElementById('contact-form');
const requested = new URLSearchParams(window.location.search).get('need');
if (requested && [...form.need.options].some((option) => option.value === requested)) {
  form.need.value = requested;
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const message = [
    'Hello ZedDrive Motors,',
    `Name: ${data.get('name')}`,
    `Phone: ${data.get('phone')}`,
    `I need: ${data.get('need')}`,
    String(data.get('message') || '').trim(),
    'Sent from the ZedDrive demo site. Nothing was stored on the site.',
  ].filter(Boolean).join('\n');
  window.location.href = waLink(message);
});
