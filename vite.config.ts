import { defineConfig, type Plugin } from 'vite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { brandIcon, icon, type BrandName, type IconName } from './src/lib/icons';

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

/** <span data-icon="phone"></span> にビルド時に SVG を埋め込む（後から差し込むと表示がずれるため） */
function inlineIcons(): Plugin {
  return {
    name: 'inline-icons',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        return html.replace(/<(span|button|a)([^>]*?)\sdata-(icon|brand)="([\w-]+)"([^>]*)>/g, (_all, tag: string, pre: string, kind: string, name: string, post: string) => {
          const size = Number(/data-icon-size="(\d+)"/.exec(pre + post)?.[1] ?? 24);
          const svg = kind === 'icon' ? icon(name as IconName, { size }) : brandIcon(name as BrandName, size);
          return `<${tag}${pre} data-${kind}="${name}"${post} data-icon-done="1">${svg}`;
        });
      },
    },
  };
}

export default defineConfig({
  plugins: [partials(), inlineIcons()],
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
