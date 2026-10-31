import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));

function htmlPartials() {
  return {
    name: 'html-partials',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return html.replace(/<include\s+src="([^"]+)"\s*>\s*<\/include>/g, (_, src) => {
          return fs.readFileSync(resolve(root, 'src/partials', src), 'utf8');
        });
      },
    },
  };
}

export default defineConfig({
  base: '/lusaka-car-rental-sales/',
  plugins: [htmlPartials()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        buy: resolve(root, 'buy.html'),
        car: resolve(root, 'car.html'),
        rent: resolve(root, 'rent.html'),
        about: resolve(root, 'about.html'),
        contact: resolve(root, 'contact.html'),
      },
    },
  },
});
