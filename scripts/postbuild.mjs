import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSeo } from './load-seo.mjs';

const { ROUTE_SEO, getCanonicalUrl, getStructuredData, INDEX_ROBOTS, PREVIEW_IMAGE, PREVIEW_ALT } = await loadSeo();
const distDir = fileURLToPath(new URL('../dist/', import.meta.url));
const template = await readFile(path.join(distDir, 'index.html'), 'utf8');
const escapeHtml = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

function applyRouteMeta(html, route, meta) {
  const canonical = getCanonicalUrl(route);
  const values = { title: meta.title, description: meta.description, url: canonical };
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(meta.title)}</title>`)
    .replace(/<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${canonical}" />`);
  for (const [key, value] of Object.entries(values)) {
    for (const prefix of ['', 'og:', 'twitter:']) {
      if (!prefix && key === 'url') continue;
      const attribute = prefix === 'og:' ? 'property' : 'name';
      const pattern = new RegExp(`<meta ${attribute}="${prefix}${key}" content="[^"]*"\\s*\\/>`);
      html = html.replace(pattern, `<meta ${attribute}="${prefix}${key}" content="${escapeHtml(value)}" />`);
    }
  }
  for (const name of ['robots', 'googlebot']) {
    html = html.replace(new RegExp(`<meta name="${name}" content="[^"]*"\\s*\\/>`), `<meta name="${name}" content="${INDEX_ROBOTS}" />`);
  }
  for (const [attribute, prefix] of [['property', 'og:'], ['name', 'twitter:']]) {
    for (const [key, value] of [['image', PREVIEW_IMAGE], ['image:alt', PREVIEW_ALT]]) {
      html = html.replace(new RegExp(`<meta ${attribute}="${prefix}${key}" content="[^"]*"\\s*\\/>`), `<meta ${attribute}="${prefix}${key}" content="${escapeHtml(value)}" />`);
    }
  }
  const structured = JSON.stringify(getStructuredData(route)).replaceAll('<', '\\u003c');
  return html.replace(/<script id="page-structured-data" type="application\/ld\+json">[\s\S]*?<\/script>/,
    `<script id="page-structured-data" type="application/ld+json">${structured}</script>`);
}

for (const [route, meta] of Object.entries(ROUTE_SEO)) {
  const directory = path.join(distDir, route.slice(1));
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, 'index.html'), applyRouteMeta(template, route, meta));
}

// No build-time lastmod: deployments do not establish when a lesson changed.
const urls = Object.keys(ROUTE_SEO).map(route => `  <url><loc>${getCanonicalUrl(route)}</loc></url>`);
await writeFile(path.join(distDir, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
