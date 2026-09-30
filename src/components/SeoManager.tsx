import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getCanonicalUrl, getSeoMeta, getStructuredData, isKnownRoute, INDEX_ROBOTS } from '../seo';

function setMetaContent(selector: string, content: string) {
  const node = document.querySelector<HTMLMetaElement>(selector);
  if (node) {
    node.setAttribute('content', content);
  }
}

function setCanonicalHref(href: string) {
  const node = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (node) {
    node.setAttribute('href', href);
  }
}

export function SeoManager() {
  const location = useLocation();

  useEffect(() => {
    const seo = getSeoMeta(location.pathname);
    const canonical = getCanonicalUrl(location.pathname);

    document.title = seo.title;
    setMetaContent('meta[name="title"]', seo.title);
    setMetaContent('meta[name="description"]', seo.description);
    setMetaContent('meta[property="og:title"]', seo.title);
    setMetaContent('meta[property="og:description"]', seo.description);
    setMetaContent('meta[property="og:url"]', canonical);
    setMetaContent('meta[name="twitter:title"]', seo.title);
    setMetaContent('meta[name="twitter:description"]', seo.description);
    setMetaContent('meta[name="twitter:url"]', canonical);
    const robots = isKnownRoute(location.pathname) ? INDEX_ROBOTS : 'noindex, follow';
    setMetaContent('meta[name="robots"]', robots);
    setMetaContent('meta[name="googlebot"]', robots);
    const structured = document.getElementById('page-structured-data');
    if (structured) structured.textContent = JSON.stringify(getStructuredData(location.pathname));
    setCanonicalHref(canonical);
  }, [location.pathname]);

  return null;
}
