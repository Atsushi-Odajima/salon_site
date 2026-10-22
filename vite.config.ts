import { defineConfig, type Plugin } from 'vite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** HTML 内の <!--partial:name--> を partials/name.html の内容に置き換える */
function partials(): Plugin {
  return {
    name: 'html-partials',
    transformIndexHtml(html) {
      return html.replace(/<!--partial:([\w-]+)-->/g, (_, name: string) =>
        readFileSync(resolve(__dirname, 'partials', `${name}.html`), 'utf8'),
      );
    },
  };
}

export default defineConfig({
  plugins: [partials()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        reserve: resolve(__dirname, 'reserve/index.html'),
        admin: resolve(__dirname, 'admin/index.html'),
      },
    },
  },
});
