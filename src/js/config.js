// PLACEHOLDER numbers for this demo. Not a real phone line or WhatsApp account.
export const WHATSAPP_NUMBER = '260970000000';
export const TEL_NUMBER = '+260970000000';
export const PHONE_DISPLAY = '+260 9XX XXX XXX';

export function media(path) {
  const base = import.meta.env.BASE_URL;
  return base + String(path).replace(/^\//, '');
}

export function page(file) {
  return media(file);
}
