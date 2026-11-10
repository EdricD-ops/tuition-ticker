/// <reference types="vitest/config" />
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });
}

/**
 * Emits `sw.js` for offline use. It precaches the app shell, the Latin font subsets and the
 * files in `public/`; other font subsets are cached the first time a page needs them.
 */
function serviceWorker(): Plugin {
  return {
    name: 'tuition-ticker-sw',
    apply: 'build',
    generateBundle(_options, bundle) {
      const built = Object.keys(bundle).filter(
        (f) => /\.(js|css|html)$/.test(f) || (/\.woff2$/.test(f) && /latin/.test(f)),
      );
      const publicDir = 'public';
      const statics = listFiles(publicDir).map((f) => relative(publicDir, f).split('\\').join('/'))
        // The link-preview image is for crawlers, not for offline use.
        .filter((f) => f !== 'og.png');
      // index.html is emitted after this hook runs, so list it explicitly.
      const precache = [...new Set(['index.html', ...built, ...statics])].filter((f) => f !== 'sw.js').sort();
      const template = readFileSync('src/pwa/sw-template.js', 'utf8');
      // A new file list or new worker code means a new cache.
      const version = createHash('sha256')
        .update(precache.join('\n'))
        .update(template)
        .digest('hex')
        .slice(0, 12);
      const source = template
        .replace('__VERSION__', version)
        .replace('__PRECACHE__', JSON.stringify(precache, null, 2));
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}

export default defineConfig({
  // Relative asset paths: the build works at any sub-path (GitHub Pages serves it from
  // /tuition-ticker/, forks from their own repo name) without changes.
  base: './',
  plugins: [react(), tailwindcss(), serviceWorker()],
  test: {
    include: ['src/**/*.test.ts'],
  },
});
