import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { loadSeo } from './load-seo.mjs';

const dist = resolve(import.meta.dirname, '../dist');
const { ROUTE_SEO, getSeoMeta, getCanonicalUrl, getStructuredData, isKnownRoute } = await loadSeo();
const routes = ['', 'protocol', 'math', 'encoding', 'trace', 'polynomials', 'commitments', 'composition', 'composition-details', 'constraint-eval', 'prover-verifier', 'fri', 'zk', 'verify', 'proof-security', 'glossary', 'resources', 'implementation'];
assert.deepEqual(Object.keys(ROUTE_SEO).sort(), routes.map(route => `/${route}`).sort(), 'Metadata covers every lesson');
const app = await readFile(resolve(dist, '../src/App.tsx'), 'utf8');
const appRoutes = [...app.matchAll(/<Route path="([^"*]+)"/g)].map(([, route]) => route === '/' ? '' : route);
assert.deepEqual(appRoutes.sort(), [...routes].sort(), 'Metadata and sitemap cover the application routes');
const sitemap = await readFile(resolve(dist, 'sitemap.xml'), 'utf8');
const listed = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => url);
assert.equal(new Set(listed).size, routes.length, 'Sitemap has no duplicate or missing lessons');
assert(!/<lastmod>|<changefreq>|<priority>/.test(sitemap), 'Sitemap must not invent dates or update schedules');
for (const route of routes) {
  const html = await readFile(resolve(dist, route, 'index.html'), 'utf8');
  const canonical = `https://floatingpragma.io/starklab/${route ? route + '/' : ''}`;
  assert(html.includes(`rel="canonical" href="${canonical}"`), `Missing canonical: ${route}`);
  assert.equal([...html.matchAll(/rel="canonical"/g)].length, 1, `Duplicate canonical: ${route}`);
  assert(listed.includes(canonical), `Missing sitemap URL: ${route}`);
  const meta = getSeoMeta(`/${route}`);
  assert(html.includes(`<title>${meta.title}</title>`), `Wrong static title: ${route}`);
  for (const attribute of ['name="description"', 'property="og:description"', 'name="twitter:description"']) {
    assert(html.includes(`${attribute} content="${meta.description}"`), `Wrong description ${attribute}: ${route}`);
  }
  assert(html.includes('name="robots" content="index, follow, max-image-preview:large'), `Missing indexing policy: ${route}`);
  assert(html.includes('property="og:site_name" content="Pragma Research"'), `Missing publisher: ${route}`);
  assert(html.includes(`property="og:url" content="${canonical}"`), `Wrong Open Graph URL: ${route}`);
  assert(html.includes(`name="twitter:url" content="${canonical}"`), `Wrong Twitter URL: ${route}`);
  const structured = JSON.parse(html.match(/<script id="page-structured-data" type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1] ?? 'null');
  const page = structured?.['@graph'].find(item => Array.isArray(item['@type']) && item['@type'].includes('WebPage'));
  const breadcrumbs = structured?.['@graph'].find(item => item['@type'] === 'BreadcrumbList');
  assert.equal(page?.url, canonical, `Wrong structured page: ${route}`);
  assert.equal(page?.name, meta.title, `Wrong structured title: ${route}`);
  assert.equal(breadcrumbs?.itemListElement.at(-1).item, canonical, `Wrong breadcrumb destination: ${route}`);
  assert(html.includes('id="root"'), `Missing app root: ${route}`);
  assert(html.includes('floatingpragma.io/favicon.svg?v=6'), `Missing Pragma icon: ${route}`);
  assert(!/http-equiv="refresh"|location\.replace/.test(html), `Lesson replaced by redirect: ${route}`);
  const assets = [...html.matchAll(/(?:src|href)="\/starklab\/(assets\/[^"?#]+)[^"]*"/g)];
  assert(assets.some(([, asset]) => asset.endsWith('.js')), `Missing application bundle: ${route}`);
  for (const [, asset] of assets) assert((await stat(resolve(dist, asset))).isFile(), `Missing asset: ${asset}`);
}
for (const pathname of ['/fri', '/fri/', '/starklab/fri/', '/fri/?example=1#fold']) {
  assert.equal(getCanonicalUrl(pathname), 'https://floatingpragma.io/starklab/fri/');
  assert.equal(getSeoMeta(pathname).title, 'STARK Lab | FRI');
}
assert.equal(isKnownRoute('/unknown-lesson'), false);
assert.equal(getStructuredData('/unknown-lesson'), null);
assert.equal(getCanonicalUrl('/unknown-lesson'), 'https://floatingpragma.io/starklab/');
assert((await readFile(resolve(dist, '404.html'), 'utf8')).includes('STARK Lab'));
console.log(`${routes.length} lesson routes: metadata, canonical URLs, structured data, sitemap, bundles, branding and 404 verified.`);
